import {BaseService, digest} from '@ucd-lib/cork-app-utils';
import FormEntryStore from '../stores/FormEntryStore.js';

import payload from '../utils/payload.js';
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

  async get(entryId, form, opts={}){
    const ido = { ...opts, entryId, form };
    const id = payload.getKey(ido);
    const store = this.store.data.get;

    const appStateOptions = {
      errorSettings: {message: 'Unable to get submission'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}/${form}/${entryId}`,
        qs: opts,
        checkCached : () => store.get(id),
        onUpdate : resp => this.store.set(
          payload.generate(ido, resp),
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