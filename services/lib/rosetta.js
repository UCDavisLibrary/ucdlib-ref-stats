import config from './config.js';


class Rosetta {

  constructor(){
    // Safety buffer to avoid using an access token that expires mid-request
    this.expirationBufferMs = 30 * 1000; // 30 seconds

    // Cache for access tokens, keyed by scope.
    this.cachedAccessTokens = {};

    // Promises for ongoing access token fetches, keyed by scope.
    this._accessTokenPromises = {};
  }

  /**
   * @description Fetches people from the Rosetta 'people' endpoint
   * @param {Object} [query] - Query params to pass through to the request (e.g. filters, limit, offset)
   * @param {Object} [opts]
   * @param {Boolean} [opts.allRecords] - If true, fetches every page of results and returns them
   * as a single combined array (see _getAll). Otherwise returns just one page (see _get).
   * @param {String} [opts.scope] - OAuth scope to request the access token for (see getAccessToken)
   * @param {Boolean} [opts.post] - If true, uses a POST request with query as the JSON body instead
   * of a GET request with query as URL search params (see _get)
   * @returns {Promise<Array|Object>} An array of people if opts.allRecords is true; otherwise
   * {results, totalCount} for a single page (see _get)
   */
  async getPeople(query, opts={}){
    if ( opts.allRecords ) {
      return await this._getAll('people', query, opts);
    } else {
      return await this._get('people', query, opts);
    }
  }

  /**
   * @description Fetches every page of results from a Rosetta API list endpoint, following
   * offset-based pagination until all records have been retrieved.
   * @param {String} endpoint - API endpoint (see _get)
   * @param {Object} [query] - Query params. If `limit` is set, it's used as the page size for
   * every request; otherwise the page size is inferred from how many records the first response
   * returns. `count` is always forced to `true` so the server populates the x-total-count header.
   * @param {Object} [opts]
   * @param {String} [opts.scope] - OAuth scope to request the token for (see getAccessToken)
   * @param {Boolean} [opts.post] - If true, each page is fetched via POST with the query as a JSON
   * body instead of GET with URL search params (see _get)
   * @returns {Promise<Array>} All records across every page, combined into one array
   */
  async _getAll(endpoint, query, opts={}) {
    query = query || {};
    let limit = query.limit ? parseInt(query.limit) : null;
    let offset = 0;
    let totalCount = Infinity;

    const results = [];
    while (results.length < totalCount) {
      const pageQuery = { ...query, count: true, offset };
      if (limit) pageQuery.limit = limit;

      const { results: pageResults, totalCount: totalCountHeader } = await this._get(endpoint, pageQuery, opts);

      if (results.length === 0) {
        if (!limit) limit = pageResults.length;
        totalCount = parseInt(totalCountHeader);
        if ( isNaN(totalCount) ) {
          throw new RosettaApiError(`Invalid x-total-count header value in ${endpoint}`, {totalCount: totalCountHeader});
        }
      }

      if (!pageResults.length) break;
      results.push(...pageResults);
      offset += pageResults.length;
    }

    return results;
  }

  /**
   * @description Makes an authenticated request to a Rosetta API endpoint
   * @param {String} endpoint - API path relative to config.rosetta.baseUrl (leading/trailing slashes optional)
   * @param {Object} [query] - Query params. Appended to the request URL for a GET request, or sent
   * as a JSON request body if opts.post is true
   * @param {Object} [opts]
   * @param {String} [opts.scope] - OAuth scope to request the access token for (see getAccessToken)
   * @param {Boolean} [opts.post] - If true, makes a POST request with `query` as the JSON body instead
   * of a GET request with `query` as URL search params - some Rosetta endpoints have a corresponding
   * POST variant that accepts the same query as a JSON body
   * @returns {Promise<Object>} {results, totalCount} - results is the parsed JSON response; totalCount is
   * the x-total-count response header value (populated when `count: true` is passed in query), or null
   * @throws {RosettaApiError} If the response is not ok
   */
  async _get(endpoint, query, opts={}){
    const url = new URL(config.rosetta.baseUrl.replace(/\/+$/, '') + '/' + endpoint.replace(/^\/+/, ''));

    const accessToken = await this.getAccessToken(opts.scope);
    const fetchOpts = {
      method: opts.post ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${accessToken}` }
    };

    if ( opts.post ) {
      fetchOpts.headers['Content-Type'] = 'application/json';
      fetchOpts.body = JSON.stringify(query || {});
    } else {
      for (const [key, value] of Object.entries(query || {})) {
        url.searchParams.set(key, value);
      }
    }

    const response = await fetch(url.toString(), fetchOpts);

    if (!response.ok) {
      throw await RosettaApiError.fromResponse(`Request to endpoint ${endpoint} failed with (${response.status})`, response);
    }

    return { results: await response.json(), totalCount: response.headers.get('x-total-count') };
  }

  /**
   * @description Get a valid Rosetta API access token for the given scope. Returns a cached
   * token if one exists and isn't near expiration; otherwise fetches a new one. Concurrent
   * calls for the same scope share a single in-flight fetch rather than triggering duplicate requests.
   * @param {String} [scope=config.rosetta.defaultScope] - OAuth scope to request the token for
   * @returns {Promise<String>} The access token
   */
  async getAccessToken(scope = config.rosetta.defaultScope) {
    const cachedToken = this.cachedAccessTokens[scope];
    if (cachedToken && cachedToken.expiresAt > Date.now() + this.expirationBufferMs) {
      return cachedToken.response.access_token;
    }

    if (!this._accessTokenPromises[scope]) {
      this._accessTokenPromises[scope] = this._fetchAccessToken(scope).finally(() => {
        delete this._accessTokenPromises[scope];
      });
    }

    const cached = await this._accessTokenPromises[scope];
    return cached.response.access_token;
  }

  /**
   * @description Fetches a new access token from the Rosetta OAuth endpoint via the client
   * credentials grant, and populates the internal cache.
   * @param {String} scope - OAuth scope to request the token for
   * @returns {Promise<Object>} {response, expiresAt} - response is the raw OAuth token response
   * body (including access_token); expiresAt is the epoch ms timestamp the token expires at
   */
  async _fetchAccessToken(scope) {
    const errorMessage = 'Unable to fetch Rosetta access token.';
    if ( !config.rosetta.clientId) {
      throw new Error(`${errorMessage} Client ID is not set.`);
    }
    if ( !config.rosetta.clientSecret) {
      throw new Error(`${errorMessage} Client Secret is not set.`);
    }
    if ( !scope) {
      throw new Error(`${errorMessage} Scope is not set.`);
    }
    if ( !config.rosetta.oauthUrl) {
      throw new Error(`${errorMessage} OAuth URL is not set.`);
    }

    const body = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: config.rosetta.clientId,
      client_secret: config.rosetta.clientSecret,
      scope: scope
    });

    const response = await fetch(config.rosetta.oauthUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    });

    if (!response.ok) {
      throw await RosettaApiError.fromResponse(errorMessage, response);
    }

    const data = await response.json();
    const cached = {
      response: data,
      expiresAt: Date.now() + (data.expires_in * 1000)
    };
    this.cachedAccessTokens[scope] = cached;
    return cached;
  }

}

/**
 * @description Error thrown when a request to the Rosetta API fails. Captures response details
 * useful for debugging/logging - status, statusText, url, and the parsed body when available.
 */
export class RosettaApiError extends Error {
  /**
   * @param {String} message - Error message
   * @param {Object} opts
   * @param {Response} [opts.response] - The fetch Response object, if one was received
   * @param {*} [opts.json] - Parsed JSON body of the response, if the body was valid JSON
   * @param {String} [opts.text] - Raw text body of the response, if it wasn't valid JSON
   */
  constructor(message, opts = {}) {
    super(message);
    this.name = 'RosettaApiError';
    this.status = opts.response?.status;
    this.statusText = opts.response?.statusText;
    this.url = opts.response?.url;
    this.json = opts.json;
    this.text = opts.text;
    this.totalCount = opts.totalCount;
  }

  /**
   * @description Builds a RosettaApiError from a failed fetch Response, reading and attempting
   * to JSON-parse the body
   * @param {String} message - Error message
   * @param {Response} response - The fetch Response object
   * @returns {Promise<RosettaApiError>}
   */
  static async fromResponse(message, response) {
    const rawText = await response.text();
    let json;
    let text = rawText;
    let totalCount = response.headers.get('x-total-count');
    try {
      json = JSON.parse(rawText);
      text = undefined;
    } catch (e) {
      // body wasn't JSON - keep as text
    }
    return new RosettaApiError(message, {response, json, text, totalCount});
  }
}


export default new Rosetta();