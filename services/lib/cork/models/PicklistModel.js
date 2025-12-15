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

  async query(query) {
    return this.service.query(query);
  }

  async get(id) {
    return this.service.get(id);
  }

  async create(data) {
    const res = await this.service.create(data);
    this.ValidationModel.notify('picklist', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  async patch(id, data) {
    const res = await this.service.patch(id, data);
    this.ValidationModel.notify('picklist', res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  async delete(id) {
    const res = await this.service.delete(id);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

}

const model = new PicklistModel();
export default model;