import {BaseModel} from '@ucd-lib/cork-app-utils';
import PicklistService from '../services/PicklistService.js';
import PicklistStore from '../stores/PicklistStore.js';

import clearCache from '../utils/clearCache.js';

class PicklistModel extends BaseModel {

  constructor() {
    super();

    this.store = PicklistStore;
    this.service = PicklistService;
      
    this.register('PicklistModel');

    this.inject('ValidationModel');
  }

  /**
   * @description Query picklists
   * @param {Object} query - Query parameters
   * @param {Object} appStateOptions - Options passed to the app state model (loader/error settings)
   * @returns {Promise}
   */
  async query(query, appStateOptions={}) {
    return this.service.query(query, appStateOptions);
  }

  /**
   * @description Get a picklist by id
   * @param {String} id - Picklist id
   * @param {Object} opts - Options passed to the service
   * @returns {Promise}
   */
  async get(id, opts={}) {
    return this.service.get(id, opts);
  }

  /**
   * @description Create a new picklist
   * @param {Object} data - Picklist data
   * @returns {Promise}
   */
  async create(data) {
    const res = await this.service.create(data);
    this.ValidationModel.notify('picklist', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Patch an existing picklist
   * @param {String} id - Picklist id
   * @param {Object} data - Partial picklist data
   * @returns {Promise}
   */
  async patch(id, data) {
    const res = await this.service.patch(id, data);
    this.ValidationModel.notify('picklist', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Delete a picklist by id
   * @param {String} id - Picklist id
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
   * @description Get picklist items for one or more picklists
   * @param {Array} picklistIds - Array of picklist ids
   * @param {String} formId - The form id to scope the items to
   * @returns {Promise}
   */
  async getItems(picklistIds, formId) {
    return this.service.items(picklistIds, formId);
  }

}

const model = new PicklistModel();
export default model;