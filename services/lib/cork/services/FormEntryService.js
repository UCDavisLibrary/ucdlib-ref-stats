import {BaseService} from '@ucd-lib/cork-app-utils';
import FormEntryStore from '../stores/FormEntryStore.js';

class FormEntryService extends BaseService {

  constructor() {
    super();
    this.store = FormEntryStore;
  }

}

const service = new FormEntryService();
export default service;