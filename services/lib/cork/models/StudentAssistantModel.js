import {BaseModel} from '@ucd-lib/cork-app-utils';
import StudentAssistantService from '../services/StudentAssistantService.js';
import StudentAssistantStore from '../stores/StudentAssistantStore.js';

import clearCache from '../utils/clearCache.js';

/**
 * @description Model for student assistant form access - active appointments, granting/updating/
 * removing form access, and syncing the resulting state to Keycloak.
 */
class StudentAssistantModel extends BaseModel {

  constructor() {
    super();

    this.store = StudentAssistantStore;
    this.service = StudentAssistantService;

    this.register('StudentAssistantModel');

    this.inject('ValidationModel');
  }

  /**
   * @description Get the list of currently active student assistant appointments
   * @param {Object} opts - Additional options for the request
   * @param {Object} appStateOptions - Options passed to the app state model
   * @returns {Promise}
   */
  async getActiveAppointments(opts={}, appStateOptions={}) {
    return this.service.getActiveAppointments(opts, appStateOptions);
  }

  /**
   * @description Query student assistant assignments with optional filtering and pagination
   * @param {Object} query - Query parameters (page, per_page, user_id, group_id, form)
   * @param {Object} appStateOptions - Options passed to the app state model
   * @returns {Promise}
   */
  async query(query, appStateOptions={}) {
    return this.service.query(query, appStateOptions);
  }

  /**
   * @description Grant student assistants access to one or more forms for a group
   * @param {Object} data - {user_id: String[], form_id: String[], group_id: Number}
   * @returns {Promise}
   */
  async create(data) {
    const res = await this.service.create(data);
    this.ValidationModel.notify('student-assistant', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Replace a student assistant's form access with an exact set of forms
   * @param {Object} data - {user_id: String, form_id: String[]}
   * @returns {Promise}
   */
  async updateFormAccess(data) {
    const res = await this.service.updateFormAccess(data);
    this.ValidationModel.notify('student-assistant', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Sync a student assistant's Keycloak account/roles to match their current form access
   * @param {Object} data - {user_id: String}
   * @returns {Promise}
   */
  async sync(data) {
    const res = await this.service.sync(data);
    this.ValidationModel.notify('student-assistant', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

}

const model = new StudentAssistantModel();
export default model;
