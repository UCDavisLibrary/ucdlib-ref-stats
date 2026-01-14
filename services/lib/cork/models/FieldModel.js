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

  async query(query, appStateOptions={}) {
    return this.service.query(query, appStateOptions);
  }

  async create(data) {
    const res = await this.service.create(data);
    this.ValidationModel.notify('field', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  async patch(data) {
    const res = await this.service.patch(data);
    this.ValidationModel.notify('field', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  async get(id, opts={}) {
    return this.service.get(id, opts);
  }
  
  async delete(id) {
    const res = await this.service.delete(id);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  async assign(fieldId, formId){
    const res = await this.service.assign({ form_field_id: fieldId, form_id: formId, action: 'assign' });
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  async unassign(fieldId, formId){
    const res = await this.service.assign({ form_field_id: fieldId, form_id: formId, action: 'unassign' });
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  async archiveAssignment(fieldId, formId){
    const res = await this.service.assign({ form_field_id: fieldId, form_id: formId, action: 'archive' });
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  async unarchiveAssignment(fieldId, formId){
    const res = await this.service.assign({ form_field_id: fieldId, form_id: formId, action: 'unarchive' });
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  

}

const model = new FieldModel();
export default model;