import {BaseService, digest} from '@ucd-lib/cork-app-utils';
import PicklistStore from '../stores/PicklistStore.js';

import payload from '../utils/payload.js';

class PicklistService extends BaseService {

  constructor() {
    super();
    this.store = PicklistStore;
  }

  get baseUrl(){
    return `/api/picklist`;
  }

  async query(query={}, modelAppStateOptions={}){
    if ( !query.page ) query.page = 1;
    let id = payload.getKey(query);
    const store = this.store.data.query;

    const appStateOptions = {
      errorSettings: {message: 'Unable to retrieve picklists'}
    };

    if ( modelAppStateOptions.errorSettings ) {
      appStateOptions.errorSettings = {
        ...appStateOptions.errorSettings,
        ...modelAppStateOptions.errorSettings
      };
    }

    if ( modelAppStateOptions.loaderSettings ){
      appStateOptions.loaderSettings = {
        ...appStateOptions.loaderSettings,
        ...modelAppStateOptions.loaderSettings
      };
    }

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}`,
        qs: query,
        checkCached : () => store.get(id),
        onUpdate : resp => this.store.set(
          payload.generate(query, resp),
          store,
          null,
          appStateOptions
        )
      })
    );

    return store.get(id);
  }

  async get(picklistId, opts={}){
    const ido = { ...opts, picklistId };
    const id = payload.getKey(ido);
    const store = this.store.data.get;

    const appStateOptions = {
      errorSettings: {message: 'Unable to get picklist'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}/${picklistId}`,
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

  async patch(id, data){
    let storeId = digest({id, data});
    const store = this.store.data.patch;

    const appStateOptions = {
      errorSettings: {message: 'Unable to update picklist'}
    };

    await this.checkRequesting(
      storeId, store,
      () => this.request({
        url : `${this.baseUrl}/${id}`,
        json: true,
        fetchOptions: { 
          method: 'PATCH',
          body: data
        },
        onUpdate : resp => this.store.set(
          {...resp, id: storeId},
          store,
          null,
          appStateOptions
        )
      })
    );
    return store.get(storeId);
  }

  async delete(id){
    const store = this.store.data.delete;

    const appStateOptions = {
      errorSettings: {message: 'Unable to delete picklist'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}/${id}`,
        fetchOptions: { 
          method: 'DELETE'
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