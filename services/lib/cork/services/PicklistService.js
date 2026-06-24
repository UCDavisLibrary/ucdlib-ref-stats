import {digest} from '@ucd-lib/cork-app-utils';
import BaseService from "./BaseService.js";
import PicklistStore from '../stores/PicklistStore.js';

import payload from '../utils/payload.js';
import serviceUtils from '../utils/serviceUtils.js';

class PicklistService extends BaseService {

  constructor() {
    super();
    this.store = PicklistStore;
  }

  /**
   * @description Base URL for picklist API endpoints.
   * @returns {string}
   */
  get baseUrl(){
    return `/api/picklist`;
  }

  /**
   * @description Queries picklists with the given filters.
   * @param {object} query - Query parameters.
   * @param {object} appStateOptions - Options passed to the app state error handler.
   * @returns {Promise<object>} Store state object for the request.
   */
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
          serviceUtils.getAppStateOptions('Unable to retrieve picklists', appStateOptions)
        )
      })
    );

    return store.get(id);
  }

  /**
   * @description Retrieves a single picklist by ID.
   * @param {string|number} picklistId - Picklist ID.
   * @param {object} opts - Additional query parameters.
   * @returns {Promise<object>} Store state object for the request.
   */
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

  /**
   * @description Creates a new picklist.
   * @param {object} data - Picklist data to submit.
   * @returns {Promise<object>} Store state object for the request.
   */
  async create(data){
    let id = await digest(data);
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

  /**
   * @description Updates an existing picklist.
   * @param {string|number} id - Picklist ID.
   * @param {object} data - Partial picklist data to patch.
   * @returns {Promise<object>} Store state object for the request.
   */
  async patch(id, data){
    let storeId = await digest({id, data});
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

  /**
   * @description Deletes a picklist by ID.
   * @param {string|number} id - Picklist ID.
   * @returns {Promise<object>} Store state object for the request.
   */
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

  /**
   * @description Retrieves items for one or more picklists, optionally scoped to a form.
   * @param {Array<string|number>} picklistIds - Array of picklist IDs.
   * @param {string|number} [formId] - Optional form ID to scope segment filtering.
   * @returns {Promise<object>} Store state object for the request.
   */
  async items(picklistIds, formId){
    let id = await digest({formId, picklistIds});
    const store = this.store.data.items;

    const appStateOptions = {
      errorSettings: {message: 'Unable to get picklist items'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}/_bulk-items/${picklistIds.join(',')}`,
        qs: formId ? {segments: [ `form:${formId}` ]} : undefined,
        checkCached : () => store.get(id),
        onUpdate : resp => this.store.set(
          { ...resp, id },
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