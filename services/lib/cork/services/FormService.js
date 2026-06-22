import {BaseService, digest} from '@ucd-lib/cork-app-utils';
import FormStore from '../stores/FormStore.js';

import payload from '../utils/payload.js';
import serviceUtils from '../utils/serviceUtils.js';

class FormService extends BaseService {

  constructor() {
    super();
    this.store = FormStore;
  }

  /**
   * @description Base URL for form API endpoints.
   * @returns {string}
   */
  get baseUrl(){
    return `/api/form`;
  }

  /**
   * @description Creates a new form.
   * @param {object} data - Form data to submit.
   * @returns {Promise<object>} Store state object for the request.
   */
  async create(data){
    let id = await digest(data);
    const store = this.store.data.create;

    const appStateOptions = {
      errorSettings: {message: 'Unable to create form'}
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
   * @description Updates an existing form.
   * @param {object} data - Partial form data to patch.
   * @returns {Promise<object>} Store state object for the request.
   */
  async patch(data){
    let id = await digest(data);
    const store = this.store.data.patch;

    const appStateOptions = {
      errorSettings: {message: 'Unable to update form'}
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
   * @description Queries forms with the given filters.
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
          serviceUtils.getAppStateOptions('Unable to retrieve forms', appStateOptions)
        )
      })
    );

    return store.get(id);
  }

  /**
   * @description Retrieves a single form by ID or name.
   * @param {string|number} idOrName - Form ID or name.
   * @param {object} opts - Additional query parameters.
   * @returns {Promise<object>} Store state object for the request.
   */
  async get(idOrName, opts={}){
    const ido = { ...opts, idOrName };
    const id = payload.getKey(ido);
    const store = this.store.data.get;

    const appStateOptions = {
      errorSettings: {message: 'Unable to get form'}
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
   * @description Deletes a form by ID.
   * @param {string|number} id - Form ID.
   * @returns {Promise<object>} Store state object for the request.
   */
  async delete(id){
    const store = this.store.data.delete;

    const appStateOptions = {
      errorSettings: {message: 'Unable to delete form'}
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

const service = new FormService();
export default service;