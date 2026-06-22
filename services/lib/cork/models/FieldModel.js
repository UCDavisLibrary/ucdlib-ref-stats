import {BaseModel} from '@ucd-lib/cork-app-utils';
import FieldService from '../services/FieldService.js';
import FieldStore from '../stores/FieldStore.js';

import clearCache from '../utils/clearCache.js';

class FieldModel extends BaseModel {

  constructor() {
    super();

    this.store = FieldStore;
    this.service = FieldService;
      
    this.register('FieldModel');

    this.inject('ValidationModel');
  }

  /**
   * @description Query form fields
   * @param {Object} query - Query parameters
   * @param {Object} appStateOptions - Options passed to the app state model (loader/error settings)
   * @returns {Promise}
   */
  async query(query, appStateOptions={}) {
    return this.service.query(query, appStateOptions);
  }

  /**
   * @description Create a new form field
   * @param {Object} data - Field data
   * @returns {Promise}
   */
  async create(data) {
    const res = await this.service.create(data);
    this.ValidationModel.notify('field', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Patch an existing form field
   * @param {Object} data - Partial field data including the field id
   * @returns {Promise}
   */
  async patch(data) {
    const res = await this.service.patch(data);
    this.ValidationModel.notify('field', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Get a form field by id
   * @param {String} id - Field id
   * @param {Object} opts - Options passed to the service
   * @returns {Promise}
   */
  async get(id, opts={}) {
    return this.service.get(id, opts);
  }

  /**
   * @description Delete a form field by id
   * @param {String} id - Field id
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
   * @description Assign a field to a form
   * @param {String} fieldId - form_field_id
   * @param {String} formId - form_id
   * @returns {Promise}
   */
  async assign(fieldId, formId){
    const res = await this.service.assign({ form_field_id: fieldId, form_id: formId, action: 'assign' });
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Unassign a field from a form
   * @param {String} fieldId - form_field_id
   * @param {String} formId - form_id
   * @returns {Promise}
   */
  async unassign(fieldId, formId){
    const res = await this.service.assign({ form_field_id: fieldId, form_id: formId, action: 'unassign' });
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Archive a field-form assignment
   * @param {String} fieldId - form_field_id
   * @param {String} formId - form_id
   * @returns {Promise}
   */
  async archiveAssignment(fieldId, formId){
    const res = await this.service.assign({ form_field_id: fieldId, form_id: formId, action: 'archive' });
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Unarchive a field-form assignment
   * @param {String} fieldId - form_field_id
   * @param {String} formId - form_id
   * @returns {Promise}
   */
  async unarchiveAssignment(fieldId, formId){
    const res = await this.service.assign({ form_field_id: fieldId, form_id: formId, action: 'unarchive' });
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Update sort_order for a field-form assignment
   * @param {string} fieldId - form_field_id
   * @param {string} formId - form_id
   * @param {number} sortOrder - new sort_order value
   * @returns {Promise}
   */
  async reorderAssignment(fieldId, formId, sortOrder){
    const res = await this.service.assign({ form_field_id: fieldId, form_id: formId, action: 'reorder', sort_order: sortOrder });
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Update assignment_settings for a field-form assignment
   * @param {string} fieldId - form_field_id
   * @param {string} formId - form_id
   * @param {Object} settings - assignment_settings object
   * @returns {Promise}
   */
  async patchAssignmentSettings(fieldId, formId, settings){
    const res = await this.service.assign({ form_field_id: fieldId, form_id: formId, action: 'settings', assignment_settings: settings });
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  

}

const model = new FieldModel();
export default model;