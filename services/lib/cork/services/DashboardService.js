import {digest} from '@ucd-lib/cork-app-utils';
import BaseService from "./BaseService.js";
import DashboardStore from '../stores/DashboardStore.js';

import payload from '../utils/payload.js';
import serviceUtils from '../utils/serviceUtils.js';

class DashboardService extends BaseService {

  constructor() {
    super();
    this.store = DashboardStore;
  }

  /**
   * @description Base URL for dashboard API endpoints.
   * @returns {string}
   */
  get baseUrl() {
    return `/api/dashboard`;
  }

  /**
   * @description Creates a new dashboard.
   * @param {object} data - Dashboard data to submit.
   * @returns {Promise<object>} Store state object for the request.
   */
  async create(data) {
    let id = await digest(data);
    const store = this.store.data.create;

    const appStateOptions = {
      errorSettings: {message: 'Unable to create dashboard'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}`,
        json: true,
        fetchOptions: {
          method: 'POST',
          body: data
        },
        onUpdate: resp => this.store.set(
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
   * @description Updates an existing dashboard.
   * @param {object} data - Partial dashboard data to patch.
   * @returns {Promise<object>} Store state object for the request.
   */
  async patch(data) {
    let id = await digest(data);
    const store = this.store.data.patch;

    const appStateOptions = {
      errorSettings: {message: 'Unable to update dashboard'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}`,
        json: true,
        fetchOptions: {
          method: 'PATCH',
          body: data
        },
        onUpdate: resp => this.store.set(
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
   * @description Queries dashboards with the given filters.
   * @param {object} query - Query parameters.
   * @param {object} appStateOptions - Options passed to the app state error handler.
   * @returns {Promise<object>} Store state object for the request.
   */
  async query(query={}, appStateOptions={}) {
    if ( !query.page ) query.page = 1;
    let id = payload.getKey(query);
    const store = this.store.data.query;

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}`,
        qs: query,
        checkCached: () => store.get(id),
        onUpdate: resp => this.store.set(
          payload.generate(query, resp),
          store,
          null,
          serviceUtils.getAppStateOptions('Unable to retrieve dashboards', appStateOptions)
        )
      })
    );

    return store.get(id);
  }

  /**
   * @description Retrieves a single dashboard by ID or name.
   * @param {string} idOrName - Dashboard ID or name.
   * @param {object} opts - Additional options.
   * @returns {Promise<object>} Store state object for the request.
   */
  async get(idOrName, opts={}) {
    const ido = { ...opts, idOrName };
    const id = payload.getKey(ido);
    const store = this.store.data.get;

    const appStateOptions = {
      errorSettings: {message: 'Unable to get dashboard'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}/${idOrName}`,
        qs: opts,
        checkCached: () => store.get(id),
        onUpdate: resp => this.store.set(
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
   * @description Retrieves a simple list of all dashboards.
   * @param {object} opts - Query options (e.g. active_only).
   * @returns {Promise<object>} Store state object for the request.
   */
  async getAll(opts={}) {
    const id = payload.getKey(opts);
    const store = this.store.data.all;

    const appStateOptions = {
      errorSettings: {message: 'Unable to retrieve dashboards'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}/all`,
        qs: opts,
        checkCached: () => store.get(id),
        onUpdate: resp => this.store.set(
          payload.generate(opts, resp),
          store,
          null,
          appStateOptions
        )
      })
    );

    return store.get(id);
  }

  /**
   * @description Fetches a Superset guest token for a dashboard.
   * @param {string} idOrName - Dashboard ID or name.
   * @returns {Promise<object>} Store state object for the request.
   */
  async getGuestToken(idOrName) {
    const id = idOrName;
    const store = this.store.data.guestToken;

    const appStateOptions = {
      errorSettings: {message: 'Unable to get Superset guest token', showToast: true},
      loaderSettings: {suppressLoader: true}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}/${idOrName}/guest-token`,
        onUpdate: resp => this.store.set(
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
   * @description Deletes a dashboard by ID.
   * @param {string} id - Dashboard ID.
   * @returns {Promise<object>} Store state object for the request.
   */
  async delete(id) {
    const store = this.store.data.delete;

    const appStateOptions = {
      errorSettings: {message: 'Unable to delete dashboard'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}/${id}`,
        fetchOptions: {
          method: 'DELETE'
        },
        onUpdate: resp => this.store.set(
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

const service = new DashboardService();
export default service;
