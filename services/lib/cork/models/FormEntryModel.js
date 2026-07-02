import {BaseModel} from '@ucd-lib/cork-app-utils';
import FormEntryService from '../services/FormEntryService.js';
import FormEntryStore from '../stores/FormEntryStore.js';
import config from '#lib/app-config.js';

import clearCache from '../utils/clearCache.js';

class FormEntryModel extends BaseModel {

  constructor() {
    super();

    this.store = FormEntryStore;
    this.service = FormEntryService;
      
    this.register('FormEntryModel');

    this.inject('ValidationModel');
  }

  /**
   * @description Create a new form entry
   * @param {String} formId - The id of the form the entry belongs to
   * @param {Object} data - Entry field values
   * @returns {Promise}
   */
  async create(formId, data) {
    const res = await this.service.create(formId, data);
    this.ValidationModel.notify(formId, res);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Get a single form entry by id
   * @param {String} entryId - The entry id
   * @param {Object} form - The form object the entry belongs to
   * @param {Object} opts - Options passed to the service
   * @returns {Promise}
   */
  get(entryId, form, opts={}) {
    return this.service.get(entryId, form, opts);
  }

  /**
   * @description Query form entries
   * @param {Object} query - Query parameters
   * @param {Object} appStateOptions - Options passed to the app state model (loader/error settings)
   * @returns {Promise}
   */
  query(query, appStateOptions={}) {
    return this.service.query(query, appStateOptions);
  }

  /**
   * @description Get form entry query filters available for the current user
   * @param {Object} opts - Query parameters
   * @param {Object} appStateOptions - Options passed to the app state model (loader/error settings)
   * @returns {Promise}
   */
  filters(opts, appStateOptions={}) {
    return this.service.filters(opts, appStateOptions);
  }

  /**
   * @description Delete the latest version of a form entry, clearing the cache on success
   * @param {String} entryId - The form_entry_id to delete (must be the latest version)
   * @param {Object} opts - Options object
   * @param {Boolean} opts.deleteAll - If true, all versions in the chain are deleted
   * @returns {Promise}
   */
  async deleteLatest(entryId, opts={}) {
    const res = await this.service.deleteLatest(entryId, opts);
    if ( res.state === 'loaded' ) {
      clearCache();
    }
    return res;
  }

  /**
   * @description Exports form entries as a CSV file download.
   * Fetches the export endpoint with auth headers, converts the response to a blob,
   * and triggers a browser file download.
   * @param {Object} params - Query parameters forwarded as URL search params (same filters as query())
   * @param {Object} opts - Options object
   * @param {String} opts.filename - Download filename (default: 'library-services-form-submissions.csv')
   * @returns {Promise<{error?: Error}>} Resolves with empty object on success, or {error} on failure
   */
  async export(params = {}, opts = {}) {
    const filename = opts.filename || 'library-services-form-submissions.csv';
    try {
      const headers = {};
      if ( config.auth?.keycloakClient ) {
        const kc = config.auth.keycloakClient;
        try { await kc.updateToken(10); } catch(e) {}
        if ( kc.token ) headers.Authorization = `Bearer ${kc.token}`;
      }
      const qs = new URLSearchParams(
        Object.entries(params).filter(([, v]) => v != null && v !== '')
      ).toString();
      const url = `/api/form-entry/export${qs ? `?${qs}` : ''}`;
      const res = await fetch(url, { headers });
      if ( !res.ok ) {
        const text = await res.text().catch(() => '');
        return { error: new Error(`Export failed: ${res.status} ${text}`) };
      }
      const blob = await res.blob();
      const href = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = href;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(href);
      return {};
    } catch(error) {
      return { error };
    }
  }

}

const model = new FormEntryModel();
export default model;