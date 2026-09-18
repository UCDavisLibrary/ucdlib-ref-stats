import pgClient from '../pgClient.js';
import config from '#lib/config.js';
import rosetta from '#lib/rosetta.js';
import keycloakAdmin from '#lib/keycloakAdmin.js';
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
   * @description Query student assistant assignments (one row per user, with forms/groups
   * aggregated into arrays) with optional filtering and pagination.
   * @param {Object} params - Query parameters
   * @param {Number} params.page - Page number
   * @param {Number} params.per_page - Number of results per page
   * @param {String} params.user_id - Filter by exact user ID
   * @param {Number} params.group_id - Filter by group ID (matches any group the user is assigned to)
   * @param {String} params.form - Filter by form name or UUID (matches any form the user is assigned to)
   * @returns {Object} Paginated results object or an error object
   */
  async query(params={}) {
    const page = params.page || 1;
    const perPage = params.per_page || 15;
    const offset = (page - 1) * perPage;

    const where = [];
    const values = [];

    if ( params.user_id ) {
      values.push(params.user_id);
      where.push(`sa.user_id = $${values.length}`);
    }

    if ( params.group_id != null ) {
      values.push(params.group_id);
      where.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(sa.groups) g WHERE (g->>'group_id')::int = $${values.length})`);
    }

    if ( params.form ) {
      values.push(params.form);
      where.push(`EXISTS (SELECT 1 FROM jsonb_array_elements(sa.forms) f WHERE f->>'name' = $${values.length} OR f->>'form_id' = $${values.length})`);
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const sql = `
      SELECT sa.*, COUNT(*) OVER() AS total_count
      FROM ${config.db.views.studentAssistantFull} sa
      ${whereSQL}
      ORDER BY sa.last_name ASC, sa.first_name ASC
      LIMIT $${values.length + 1} OFFSET $${values.length + 2}
    `;
    const r = await pgClient.query(sql, [...values, perPage, offset]);
    if ( r.error ) {
      return r;
    }
    const total_count = r.res.rows.length > 0 ? parseInt(r.res.rows[0].total_count) : 0;
    const results = r.res.rows.map(row => {
      delete row.total_count;
      return row;
    });
    return { res: {
      results,
      offset,
      per_page: perPage,
      page,
      max_page: Math.ceil(total_count / perPage),
      total_count
    }};
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

  /**
   * @description Replaces a student assistant's form access with exactly the given set of forms,
   * preserving their existing group_id. An empty formIds array removes all of their access.
   * Unlike createAssignments(), this does not check active appointment status or upsert the user
   * — it only operates on a student assistant who already has at least one assignment row, and
   * must keep working to remove access even after their appointment has ended.
   * @param {Object} opts
   * @param {String} opts.userId - Student assistant user ID
   * @param {String[]} opts.formIds - Exact set of form UUIDs the user should have access to
   * @param {String} opts.updatedBy - user_id of the admin making the change
   * @returns {Object} {res: {added, removed}} or {error}
   */
  async updateFormAccess({ userId, formIds, updatedBy }) {
    const client = await pgClient.pool.connect();
    try {
      await client.query('BEGIN');

      const existing = await client.query(
        `SELECT form_id, group_id FROM ${config.db.tables.studentAssistant} WHERE user_id = $1`,
        [userId]
      );

      const existingFormIds = existing.rows.map(r => r.form_id);
      const groupId = existing.rows[0]?.group_id ?? null;

      const toRemove = existingFormIds.filter(id => !formIds.includes(id));
      const toAdd = formIds.filter(id => !existingFormIds.includes(id));

      if ( toRemove.length ) {
        await client.query(
          `DELETE FROM ${config.db.tables.studentAssistant} WHERE user_id = $1 AND form_id = ANY($2::uuid[])`,
          [userId, toRemove]
        );
      }

      for ( const formId of toAdd ) {
        const sql = `
          INSERT INTO ${config.db.tables.studentAssistant} (user_id, form_id, group_id, created_by)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT (user_id, form_id, group_id) DO NOTHING`;
        await client.query(sql, [userId, formId, groupId, updatedBy]);
      }

      await client.query('COMMIT');
      return { res: { added: toAdd.length, removed: toRemove.length } };
    } catch (error) {
      await client.query('ROLLBACK');
      return { error };
    } finally {
      client.release();
    }
  }

  /**
   * @description Syncs a student assistant's Keycloak account/roles to match their current form
   * access in our own database. Used both as the automatic follow-up after createAssignments()/
   * updateFormAccess(), and as the manual "Sync Roles" reconciliation action.
   * @param {Object} opts
   * @param {String} opts.userId
   * @returns {Object} {res: {added, removed, created, deleted}} or {error}
   */
  async syncKeycloakAccess({ userId }) {
    const current = await this.query({ user_id: userId, per_page: 1 });
    if ( current.error ) return current;
    const row = current.res.results[0];
    const formNames = (row?.forms || []).map(f => f.name);
    return keycloakAdmin.syncFormAccess({
      userId,
      formNames,
      email: row?.email,
      firstName: row?.first_name,
      lastName: row?.last_name
    });
  }
}


export default new StudentAssistant();