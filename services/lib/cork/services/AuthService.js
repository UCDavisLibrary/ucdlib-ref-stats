import BaseService from "./BaseService.js";
import AuthStore from '../stores/AuthStore.js';
import payload from '../utils/payload.js';

class AuthService extends BaseService {

  constructor() {
    super();
    this.store = AuthStore;
  }

  /**
   * @description Base URL for field API endpoints.
   * @returns {string}
   */
  get baseUrl(){
    return `/api/auth`;
  }

  async cacheToken(){
    let ido = {action: 'cache-token'};
    let id = payload.getKey(ido);
    const store = this.store.data.cacheToken;

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}/set-cache`,
        checkCached : () => store.get(id),
        onUpdate : resp => this.store.set(
          payload.generate(ido, resp),
          store
        )
      })
    );

    return this.store.data.cacheToken.get(id);
  }

  async clearTokenServerCache(){
    let ido = {action: 'clear-token-cache'};
    let id = payload.getKey(ido);
    const store = this.store.data.cacheToken;

    await this.checkRequesting(
      id, store,
      () => this.request({
        url : `${this.baseUrl}/clear-cache`,
        checkCached : () => store.get(id),
        onUpdate : resp => this.store.set(
          payload.generate(ido, resp),
          store
        )
      })
    );

    return this.store.data.cacheToken.get(id);
  }

}

const service = new AuthService();
export default service;
