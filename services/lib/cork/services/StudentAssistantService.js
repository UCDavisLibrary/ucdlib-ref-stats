import {digest} from '@ucd-lib/cork-app-utils';
import BaseService from "./BaseService.js";
import StudentAssistantStore from '../stores/StudentAssistantStore.js';

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

}

const service = new StudentAssistantService();
export default service;
