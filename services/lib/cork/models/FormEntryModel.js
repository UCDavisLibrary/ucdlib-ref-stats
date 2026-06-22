import {BaseModel} from '@ucd-lib/cork-app-utils';
import FormEntryService from '../services/FormEntryService.js';
import FormEntryStore from '../stores/FormEntryStore.js';

import clearCache from '../utils/clearCache.js';

class FormEntryModel extends BaseModel {

  constructor() {
    super();

    this.store = FormEntryStore;
    this.service = FormEntryService;
      
    this.register('FormEntryModel');

    this.inject('ValidationModel');
  }

  /**
   * @description Create a new form entry
   * @param {String} formId - The id of the form the entry belongs to
   * @param {Object} data - Entry field values
   * @returns {Promise}
   */
  async create(formId, data) {
    const res = await this.service.create(formId, data);
    this.ValidationModel.notify(formId, res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Get a single form entry by id
   * @param {String} entryId - The entry id
   * @param {Object} form - The form object the entry belongs to
   * @param {Object} opts - Options passed to the service
   * @returns {Promise}
   */
  get(entryId, form, opts={}) {
    return this.service.get(entryId, form, opts);
  }

  /**
   * @description Query form entries
   * @param {Object} query - Query parameters
   * @param {Object} appStateOptions - Options passed to the app state model (loader/error settings)
   * @returns {Promise}
   */
  query(query, appStateOptions={}) {
    return this.service.query(query, appStateOptions);
  }

}

const model = new FormEntryModel();
export default model;