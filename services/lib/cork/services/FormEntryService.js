import {BaseService, digest} from '@ucd-lib/cork-app-utils';
import FormEntryStore from '../stores/FormEntryStore.js';

import serviceUtils from '../utils/serviceUtils.js';

class FormEntryService extends BaseService {

  constructor() {
    super();
    this.store = FormEntryStore;
  }

  get baseUrl(){
    return `/api/form-entry`;
  }

  async create(formId, data){
    let id = digest({formId, data});
    const store = this.store.data.create;

    const appStateOptions = {
      errorSettings: {message: 'Error during form submission'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}/${formId}`,
        json: true,
        fetchOptions: { 
          method: 'POST',
          body: data
        },
        onUpdate : resp => this.store.set(
          {...resp, id},
          store,
          null,
          appStateOptions
        )
      })
    );
    return store.get(id);
  }

}

const service = new FormEntryService();
export default service;