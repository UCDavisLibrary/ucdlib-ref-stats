import pgClient from '../pgClient.js';
import config from '../config.js';
import cache from './cache.js';

class LibraryIam {

  async getUserById(userId) {
    const cacheType = 'libraryIamUser';
    const cached = await cache.get(cacheType, userId, config.libraryIam.serverCacheExpiration);
    if ( cached.res?.rows?.length ) {
      return {res: cached.res.rows[0].data};
    }

    const params = {
      'id-type': 'user-id',
      groups: true,
      supervisor: true,
      'department-head': true
    }
    const r = await this.get(`/employees/${userId}`, params);
    if ( r.error ) return r;

    await cache.set(cacheType, userId, r.res);
    return r;
  }

  /**
   * @description Send GET request to Library IAM API
   * @param {String} url - URL path
   * @param {Object} searchParams - URL search parameters
   * @param {Object} options - Fetch options
   * @returns {Object} {res, error}
   */
  async get(url, searchParams={}, options={}){

    // remove trailing slash
    if ( url.endsWith('/') ) url = url.slice(0, -1);
    const baseUrl = config.libraryIam.url.endsWith('/') ? config.libraryIam.url.slice(0, -1) : config.libraryIam.url;

    // add search params
    const searchParamsString = new URLSearchParams(searchParams).toString();
    if ( searchParamsString ) url += `?${searchParamsString}`;

    const authHeader = `Basic ${Buffer.from(`${config.libraryIam.user}:${config.libraryIam.key}`).toString('base64')}`;

    try {
      const response = await fetch(`${baseUrl}${url}`, {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        },
        ...options
      });

      if ( response.ok ) {
        return {res: await response.json()};
      } else {
        throw new HTTPResponseError(response);
      }
    }
    catch (error) {
      return {error};
    }
  }
}


class HTTPResponseError extends Error {
	constructor(response) {
		super(`HTTP Error Response: ${response.status} ${response.statusText}`);
		this.response = response;
    this.is404 = response.status == 404;
	}
}


export default new LibraryIam();