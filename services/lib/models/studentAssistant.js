import pgClient from '../pgClient.js';
import config from '#lib/config.js';
import rosetta from '#lib/rosetta.js';
import cache from './cache.js';
import models from '#models';

class StudentAssistant {

  constructor() {
    this.cacheType = 'studentAssistant';
  }

  async getActiveAppointments() {

    const cacheId = 'activeAppointments';
    const cached = await cache.get(this.cacheType, cacheId, config.rosetta.cacheExpiration);
    if ( cached.res?.rows?.length ) {
      return {res: cached.res.rows[0].data?.[cacheId]};
    }

    try {
      const params = {
        affiliationContains: "student",
        department: "060500",
        limit: "500",
        count: true
      };
      const r = await rosetta.getPeople(params);
      const activeAppointments = (r.results || [])
        .map(person => {
          return {
            iamId: person.id?.iam_id || '',
            userId: person.id?.login_id || '',
            name: person.displayname || '',
            firstName: person.name?.lived_first_name || '',
            lastName: person.name?.lived_last_name || '',
            email: person.email?.campus || ''
          };
        });
      
      await cache.set(this.cacheType, cacheId, {[cacheId]: activeAppointments});
      return {res: activeAppointments};

    } catch (error) {
      return {error};
    }

  }

  /**
   * @description Grants student assistants access to one or more forms for a group, creating
   * users as needed. userIds not found in the current active appointments list are silently
   * skipped. A student assistant is only ever assigned to one group at a time: if they already
   * have assignment rows under a different group, those existing rows are moved to the new
   * group rather than left behind under the old one. Duplicate (user, form, group) combinations
   * are silently skipped via ON CONFLICT.
   * @param {Object} opts
   * @param {String[]} opts.userIds - Student assistant user IDs to grant access to
   * @param {String[]} opts.formIds - Form UUIDs to grant access to
   * @param {Number} opts.groupId - Group ID the access is scoped to
   * @param {String} opts.createdBy - user_id of the admin granting access
   * @returns {Object} {res: {created, requested, skippedUsers}} or {error}
   */
  async createAssignments({ userIds, formIds, groupId, createdBy }) {
    const appointments = await this.getActiveAppointments();
    if ( appointments.error ) return appointments;

    const byUserId = new Map(appointments.res.map(p => [p.userId, p]));
    const validUserIds = userIds.filter(id => byUserId.has(id));

    for ( const userId of validUserIds ) {
      const person = byUserId.get(userId);
      const r = await models.user.upsert({
        userId: person.userId,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email
      });
      if ( r.error ) return r;
    }

    if ( validUserIds.length ) {
      const moveSql = `
        UPDATE ${config.db.tables.studentAssistant}
        SET group_id = $1
        WHERE user_id = ANY($2::varchar[]) AND group_id != $1`;
      const r = await pgClient.query(moveSql, [groupId, validUserIds]);
      if ( r.error ) return r;
    }

    const created = [];
    for ( const userId of validUserIds ) {
      for ( const formId of formIds ) {
        const sql = `
          INSERT INTO ${config.db.tables.studentAssistant} (user_id, form_id, group_id, created_by)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, form_id, group_id) DO NOTHING
          RETURNING student_assistant_assignment_id`;
        const r = await pgClient.query(sql, [userId, formId, groupId, createdBy]);
        if ( r.error ) return r;
        if ( r.res.rows[0] ) created.push(r.res.rows[0]);
      }
    }

    return { res: {
      created: created.length,
      requested: validUserIds.length * formIds.length,
      skippedUsers: userIds.filter(id => !byUserId.has(id))
    }};
  }
}


export default new StudentAssistant();