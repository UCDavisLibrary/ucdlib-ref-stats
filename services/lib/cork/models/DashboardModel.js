import {BaseModel} from '@ucd-lib/cork-app-utils';
import DashboardService from '../services/DashboardService.js';
import DashboardStore from '../stores/DashboardStore.js';

import clearCache from '../utils/clearCache.js';

class DashboardModel extends BaseModel {

  constructor() {
    super();

    this.store = DashboardStore;
    this.service = DashboardService;

    this.register('DashboardModel');

    this.inject('ValidationModel');
  }

  /**
   * @description Query dashboards with optional filtering and pagination
   * @param {Object} query - Query parameters
   * @param {Object} appStateOptions - Options passed to the app state model
   * @returns {Promise}
   */
  async query(query, appStateOptions={}) {
    return this.service.query(query, appStateOptions);
  }

  /**
   * @description Get a dashboard by ID or name
   * @param {String} id - Dashboard ID or name
   * @param {Object} opts - Options passed to the service
   * @returns {Promise}
   */
  async get(id, opts={}) {
    return this.service.get(id, opts);
  }

  /**
   * @description Get a simple list of all dashboards
   * @param {Object} opts - Query options (e.g. active_only)
   * @returns {Promise}
   */
  async getAllDashboards(opts={}) {
    return this.service.getAll(opts);
  }

  /**
   * @description Create a new dashboard
   * @param {Object} data - Dashboard data
   * @returns {Promise}
   */
  async create(data) {
    const res = await this.service.create(data);
    this.ValidationModel.notify('dashboard', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Patch an existing dashboard
   * @param {Object} data - Partial dashboard data including the dashboard id
   * @returns {Promise}
   */
  async patch(data) {
    const res = await this.service.patch(data);
    this.ValidationModel.notify('dashboard', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Delete a dashboard by ID
   * @param {String} id - Dashboard ID
   * @returns {Promise}
   */
  async delete(id) {
    const res = await this.service.delete(id);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Fetch a Superset guest token for embedding a dashboard
   * @param {String} idOrName - Dashboard ID or name
   * @returns {Promise}
   */
  async getGuestToken(idOrName) {
    return this.service.getGuestToken(idOrName);
  }

}

const model = new DashboardModel();
export default model;
