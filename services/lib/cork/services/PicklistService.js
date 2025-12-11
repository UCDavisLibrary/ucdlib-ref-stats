import {BaseService, digest} from '@ucd-lib/cork-app-utils';
import PicklistStore from '../stores/PicklistStore.js';

class PicklistService extends BaseService {

  constructor() {
    super();
    this.store = PicklistStore;
  }

  get baseUrl(){
    return `/api/picklist`;
  }

  async create(data){
    let id = digest(data);
    const store = this.store.data.create;

    const appStateOptions = {
      errorSettings: {message: 'Unable to create picklist'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}`,
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

const service = new PicklistService();
export default service;