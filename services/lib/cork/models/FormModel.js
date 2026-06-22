import {BaseModel} from '@ucd-lib/cork-app-utils';
import FormService from '../services/FormService.js';
import FormStore from '../stores/FormStore.js';

import clearCache from '../utils/clearCache.js';

class FormModel extends BaseModel {

  constructor() {
    super();

    this.store = FormStore;
    this.service = FormService;
      
    this.register('FormModel');

    this.inject('ValidationModel');
  }

  /**
   * @description Query forms
   * @param {Object} query - Query parameters
   * @param {Object} appStateOptions - Options passed to the app state model (loader/error settings)
   * @returns {Promise}
   */
  async query(query, appStateOptions={}) {
    return this.service.query(query, appStateOptions);
  }

  /**
   * @description Create a new form
   * @param {Object} data - Form data
   * @returns {Promise}
   */
  async create(data) {
    const res = await this.service.create(data);
    this.ValidationModel.notify('form', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Patch an existing form
   * @param {Object} data - Partial form data including the form id
   * @returns {Promise}
   */
  async patch(data) {
    const res = await this.service.patch(data);
    this.ValidationModel.notify('form', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Get a form by id
   * @param {String} id - Form id
   * @param {Object} opts - Options passed to the service
   * @returns {Promise}
   */
  async get(id, opts={}) {
    return this.service.get(id, opts);
  }

  /**
   * @description Delete a form by id
   * @param {String} id - Form id
   * @returns {Promise}
   */
  async delete(id) {
    const res = await this.service.delete(id);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

}

const model = new FormModel();
export default model;