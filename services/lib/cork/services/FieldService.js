import {digest} from '@ucd-lib/cork-app-utils';
import BaseService from "./BaseService.js";
import FieldStore from '../stores/FieldStore.js';

import payload from '../utils/payload.js';
import serviceUtils from '../utils/serviceUtils.js';

class FieldService extends BaseService {

  constructor() {
    super();
    this.store = FieldStore;
  }

  /**
   * @description Base URL for field API endpoints.
   * @returns {string}
   */
  get baseUrl(){
    return `/api/field`;
  }

  /**
   * @description Creates a new field.
   * @param {object} data - Field data to submit.
   * @returns {Promise<object>} Store state object for the request.
   */
  async create(data){
    let id = await digest(data);
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

  /**
   * @description Updates an existing field.
   * @param {object} data - Partial field data to patch.
   * @returns {Promise<object>} Store state object for the request.
   */
  async patch(data){
    let id = await digest(data);
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

  /**
   * @description Queries fields with the given filters.
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
          serviceUtils.getAppStateOptions('Unable to retrieve fields', appStateOptions)
        )
      })
    );

    return store.get(id);
  }

  /**
   * @description Retrieves a single field by ID or name.
   * @param {string|number} idOrName - Field ID or name.
   * @param {object} opts - Additional query parameters.
   * @returns {Promise<object>} Store state object for the request.
   */
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

  /**
   * @description Deletes a field by ID.
   * @param {string|number} id - Field ID.
   * @returns {Promise<object>} Store state object for the request.
   */
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

  /**
   * @description Retrieves all active groups from the Library IAM API (via server cache).
   * @param {object} opts
   * @param {boolean} opts.clearCache - If true, instructs the server to bust its group cache before responding. Only takes effect for admin users.
   * @returns {Promise<object>} Store state object for the request.
   */
  async getGroups(opts={}) {
    const ido = { action: 'all'};
    const q = {};
    if ( opts.clearCache ) {
      ido['clearCache']= true;
      q['clear-cache'] = true;
    }
    const id = payload.getKey(ido);
    const store = this.store.data.groups;
    await this.checkRequesting(id, store, () => this.request({
      url: '/api/assignment/groups',
      qs: q,
      checkCached: opts.clearCache ? undefined : () => store.get(id),
      onUpdate: resp => this.store.set(
        { ...resp, id },
        store,
        null,
        { errorSettings: { message: 'Unable to load groups' } }
      )
    }));
    return store.get(id);
  }

  /**
   * @description Assigns, unassigns, archives, or unarchives a field on a form.
   * @param {object} data - Assignment payload including the action and target identifiers.
   * @returns {Promise<object>} Store state object for the request.
   */
  async assign(data){
    let id = await digest(data);
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