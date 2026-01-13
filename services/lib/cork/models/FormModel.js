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

  async query(query, appStateOptions={}) {
    return this.service.query(query, appStateOptions);
  }

  async create(data) {
    const res = await this.service.create(data);
    this.ValidationModel.notify('form', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  async patch(data) {
    const res = await this.service.patch(data);
    this.ValidationModel.notify('form', res);
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

}

const model = new FormModel();
export default model;