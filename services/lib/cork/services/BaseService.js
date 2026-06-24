import { BaseService } from '@ucd-lib/cork-app-utils';
import config from '#lib/app-config.js';

/**
 * @class BaseServiceImp
 * @description Extends the cork-app-utils BaseService to add auth headers to requests
 * Import this class instead of BaseService directly from @ucd-lib/cork-app-utils
 */
export default class BaseServiceImp extends BaseService {
  constructor() {
    super();
  }

  /**
   * @description Adds auth headers to request before calling super.request
   * @param {Object} options - request options
   * @returns
   */
  async request(options){
    if( config.auth?.keycloakClient ) {
      const kc = config.auth.keycloakClient;
      if( !options.fetchOptions ) options.fetchOptions = {};
      if( !options.fetchOptions.headers ) options.fetchOptions.headers = {};
      try {
        await kc.updateToken(10);
        options.fetchOptions.headers.Authorization = `Bearer ${kc.token}`
      } catch (error) {}
    }

    return super.request(options);
  }
}
