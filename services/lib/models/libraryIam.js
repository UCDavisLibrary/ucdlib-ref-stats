import pgClient from '../pgClient.js';
import config from '../config.js';
import cache from './cache.js';

class LibraryIam {

  constructor() {
    this.cacheTypes = {
      user: 'libraryIamUser',
      groups: 'libraryIamGroups'
    }
  }

  /**
   * @description Clears the cached group data for all groups.
   * @returns {Object} - {res, error}
   */
  async clearAllGroupCache(){
    const cacheType = this.cacheTypes.groups;
    const response = await cache.delete(cacheType, 'all');
    if ( response.error ) {
      return response;
    }
    return {res: true};
  }

  /**
   * @description Gets all active groups from the Library IAM API or cache.
   * @returns {Object} - {res, error}
   */
  async getAllGroups(){
    const cacheType = this.cacheTypes.groups;
    const cached = await cache.get(cacheType, 'all', config.libraryIam.serverCacheExpiration);
    if ( cached.res?.rows?.length ) {
      return {res: cached.res.rows[0].data?.['all']};
    }

    const params = {
      head: true,
      'filter-active': true
    };
    const r = await this.get(`/groups`, params);
    if ( r.error ) return r;

    await cache.set(cacheType, 'all', {'all': r.res});
    return r;
  }

  /**
   * @description Clears the cached user data for a given user ID.
   * @param {String} userId - The user ID for which to clear the cache.
   * @returns {Object} - {res, error}
   */
  async clearUserCache(userId) {
    const cacheType = this.cacheTypes.user;
    const response = await cache.delete(cacheType, userId);
    if ( response.error ) {
      return response;
    }
    return {res: true};
  }

  /**
   * @description Gets user data by ID from the Library IAM API or cache.
   * @param {String} userId - The user ID for which to retrieve data.
   * @returns {Object} - {res, error}
   */
  async getUserById(userId) {
    const cacheType = this.cacheTypes.user;
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