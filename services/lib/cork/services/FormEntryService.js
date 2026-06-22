import {BaseService, digest} from '@ucd-lib/cork-app-utils';
import FormEntryStore from '../stores/FormEntryStore.js';

import payload from '../utils/payload.js';
import serviceUtils from '../utils/serviceUtils.js';

class FormEntryService extends BaseService {

  constructor() {
    super();
    this.store = FormEntryStore;
  }

  /**
   * @description Base URL for form entry API endpoints.
   * @returns {string}
   */
  get baseUrl(){
    return `/api/form-entry`;
  }

  /**
   * @description Submits a new entry for the specified form.
   * @param {string|number} formId - ID of the form to submit an entry for.
   * @param {object} data - Entry field values.
   * @returns {Promise<object>} Store state object for the request.
   */
  async create(formId, data){
    let id = await digest({formId, data});
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

  /**
   * @description Retrieves a single form entry by ID.
   * @param {string|number} entryId - ID of the form entry.
   * @param {string|number} form - ID or name of the form.
   * @param {object} opts - Additional query parameters.
   * @returns {Promise<object>} Store state object for the request.
   */
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

  /**
   * @description Queries form entries with the given filters.
   * @param {object} query - Query parameters.
   * @param {object} appStateOptions - Options passed to the app state error handler.
   * @returns {Promise<object>} Store state object for the request.
   */
  async query(query={}, appStateOptions={}){
    if ( !query.page ) query.page = 1;
    let id = await digest(query);
    const store = this.store.data.query;

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}`,
        qs: query,
        checkCached : () => store.get(id),
        onUpdate : resp => this.store.set(
          {...resp, id},
          store,
          null,
          serviceUtils.getAppStateOptions('Unable to retrieve submissions', appStateOptions)
        )
      })
    );

    return store.get(id);
  }

}

const service = new FormEntryService();
export default service;