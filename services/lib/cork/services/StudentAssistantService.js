import {digest} from '@ucd-lib/cork-app-utils';
import BaseService from "./BaseService.js";
import StudentAssistantStore from '../stores/StudentAssistantStore.js';

import payload from '../utils/payload.js';
import serviceUtils from '../utils/serviceUtils.js';

/**
 * @description Service for the /api/student-assistant endpoints.
 */
class StudentAssistantService extends BaseService {

  constructor() {
    super();
    this.store = StudentAssistantStore;
  }

  /**
   * @description Base URL for student assistant API endpoints.
   * @returns {string}
   */
  get baseUrl() {
    return `/api/student-assistant`;
  }

  /**
   * @description Retrieves the list of currently active student assistant appointments.
   * @returns {Promise<object>} Store state object for the request.
   */
  async getActiveAppointments() {
    const id = 'activeAppointments';
    const store = this.store.data.activeAppointments;

    const appStateOptions = {
      errorSettings: {message: 'Unable to retrieve active student assistant appointments'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}/active-appointments`,
        checkCached: () => store.get(id),
        onUpdate: resp => this.store.set(
          {...resp, id},
          store,
          null,
          appStateOptions
        )
      })
    );

    return store.get(id);
  }

  /**
   * @description Queries student assistant assignments with optional filtering and pagination.
   * @param {Object} query - Query parameters (page, per_page, user_id, group_id, form)
   * @param {Object} appStateOptions - Options passed to the app state error handler.
   * @returns {Promise<object>} Store state object for the request.
   */
  async query(query={}, appStateOptions={}) {
    if ( !query.page ) query.page = 1;
    let id = payload.getKey(query);
    const store = this.store.data.query;

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}`,
        qs: query,
        checkCached: () => store.get(id),
        onUpdate: resp => this.store.set(
          payload.generate(query, resp),
          store,
          null,
          serviceUtils.getAppStateOptions('Unable to retrieve student assistant assignments', appStateOptions)
        )
      })
    );

    return store.get(id);
  }

  /**
   * @description Grants student assistants access to one or more forms for a group.
   * @param {Object} data - {user_id: String[], form_id: String[], group_id: Number}
   * @returns {Promise<object>} Store state object for the request.
   */
  async create(data) {
    const id = await digest(data);
    const store = this.store.data.create;

    const appStateOptions = {
      errorSettings: {message: 'Unable to grant student assistant access'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}`,
        json: true,
        fetchOptions: {
          method: 'POST',
          body: data
        },
        onUpdate: resp => this.store.set(
          {...resp, id},
          store,
          null,
          appStateOptions
        )
      })
    );
    return store.get(id);
  }

  /**
   * @description Replaces a student assistant's form access with an exact set of forms.
   * @param {Object} data - {user_id: String, form_id: String[]}
   * @returns {Promise<object>} Store state object for the request.
   */
  async updateFormAccess(data) {
    const id = await digest(data);
    const store = this.store.data.updateFormAccess;

    const appStateOptions = {
      errorSettings: {message: 'Unable to update student assistant form access'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}`,
        json: true,
        fetchOptions: {
          method: 'PATCH',
          body: data
        },
        onUpdate: resp => this.store.set(
          {...resp, id},
          store,
          null,
          appStateOptions
        )
      })
    );
    return store.get(id);
  }

  /**
   * @description Syncs a student assistant's Keycloak account/roles to match their current form access.
   * @param {Object} data - {user_id: String}
   * @returns {Promise<object>} Store state object for the request.
   */
  async sync(data) {
    const id = await digest(data);
    const store = this.store.data.sync;

    const appStateOptions = {
      errorSettings: {message: 'Unable to sync Keycloak roles for student assistant'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}/sync`,
        json: true,
        fetchOptions: {
          method: 'POST',
          body: data
        },
        onUpdate: resp => this.store.set(
          {...resp, id},
          store,
          null,
          appStateOptions
        )
      })
    );
    return store.get(id);
  }

}

const service = new StudentAssistantService();
export default service;
