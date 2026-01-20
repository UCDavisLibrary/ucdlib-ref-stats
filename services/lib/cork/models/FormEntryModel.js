import {BaseModel} from '@ucd-lib/cork-app-utils';
import FormEntryService from '../services/FormEntryService.js';
import FormEntryStore from '../stores/FormEntryStore.js';

class FormEntryModel extends BaseModel {

  constructor() {
    super();

    this.store = FormEntryStore;
    this.service = FormEntryService;
      
    this.register('FormEntryModel');
  }

}

const model = new FormEntryModel();
export default model;