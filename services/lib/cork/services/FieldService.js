import {BaseService, digest} from '@ucd-lib/cork-app-utils';
import FieldStore from '../stores/FieldStore.js';

import payload from '../utils/payload.js';
import serviceUtils from '../utils/serviceUtils.js';

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

  async patch(data){
    let id = digest(data);
    const store = this.store.data.patch;

    const appStateOptions = {
      errorSettings: {message: 'Unable to update field'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}`,
        json: true,
        fetchOptions: { 
          method: 'PATCH',
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

  async query(query={}, appStateOptions={}){
    if ( !query.page ) query.page = 1;
    let id = payload.getKey(query);
    const store = this.store.data.query;

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
          serviceUtils.getAppStateOptions('Unable to retrieve fields', appStateOptions)
        )
      })
    );

    return store.get(id);
  }

  async get(idOrName, opts={}){
    const ido = { ...opts, idOrName };
    const id = payload.getKey(ido);
    const store = this.store.data.get;

    const appStateOptions = {
      errorSettings: {message: 'Unable to get field'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}/${idOrName}`,
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

  async delete(id){
    const store = this.store.data.delete;

    const appStateOptions = {
      errorSettings: {message: 'Unable to delete field'}
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

  async assign(data){
    let id = digest(data);
    const store = this.store.data.assign;

    let errorMessage = 'Unable to assign field';
    if ( data.action === 'unassign' ) {
      errorMessage = 'Unable to unassign field';
    } else if ( data.action === 'archive' ) {
      errorMessage = 'Unable to archive field assignment';
    } else if ( data.action === 'unarchive' ) {
      errorMessage = 'Unable to unarchive field assignment';
    }

    const appStateOptions = {
      errorSettings: {message: errorMessage, showValidationErrors: true}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : '/api/assignment',
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