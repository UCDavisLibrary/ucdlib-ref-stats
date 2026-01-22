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

  async create(formId, data) {
    const res = await this.service.create(formId, data);
    this.ValidationModel.notify(formId, res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

}

const model = new FormEntryModel();
export default model;