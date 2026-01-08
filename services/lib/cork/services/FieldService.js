import {BaseService, digest} from '@ucd-lib/cork-app-utils';
import FieldStore from '../stores/FieldStore.js';

class FieldService extends BaseService {

  constructor() {
    super();
    this.store = FieldStore;
  }

  get baseUrl(){
    return `/api/field`;
  }

  async create(data){
    let id = digest(data);
    const store = this.store.data.create;

    const appStateOptions = {
      errorSettings: {message: 'Unable to create field'}
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

const service = new FieldService();
export default service;