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

}

const model = new FieldModel();
export default model;