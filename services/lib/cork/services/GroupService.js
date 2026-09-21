import BaseService from "./BaseService.js";
import GroupStore from '../stores/GroupStore.js';

import payload from '../utils/payload.js';

/**
 * @description Service for the /api/group endpoints.
 */
class GroupService extends BaseService {

  constructor() {
    super();
    this.store = GroupStore;
  }

  /**
   * @description Base URL for group API endpoints.
   * @returns {string}
   */
  get baseUrl() {
    return `/api/group`;
  }

  /**
   * @description Retrieves a simple list of all groups.
   * @param {object} opts - Query options (e.g. active_only).
   * @returns {Promise<object>} Store state object for the request.
   */
  async getAll(opts={}) {
    const ido = { ...opts, action: 'getAll' };
    const id = payload.getKey(ido);
    const store = this.store.data.all;

    const appStateOptions = {
      errorSettings: {message: 'Unable to retrieve groups'}
    };

    await this.checkRequesting(
      id, store,
      () => this.request({
        url: `${this.baseUrl}/all`,
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

}

const service = new GroupService();
export default service;
