import {BaseStore} from '@ucd-lib/cork-app-utils';
import { Registry, STATES } from '@ucd-lib/cork-app-utils';

export default class BaseStoreImp extends BaseStore {

  constructor() {
    super();
  }

  /**
   * @description Set store state and notify AppStateModel to update the loader and error queue
   * @param {Object} payload - The cork-app-utils payload object
   * @param {Object} store - The store data object to update
   * @param {String} eventName - The event name to emit after updating the store
   * @param {Object} opts - Additional options
   * @param {Object} opts.loaderSettings - Settings for the loading indicator
   * @param {Object} opts.errorSettings - Settings for the error display
   */
  set(payload, store, eventName, opts={}) {
    super.set(payload, store, eventName);
    const AppStateModel = Registry.models['AppStateModel'];
    if ( !AppStateModel ) return;

    if ( payload.state === STATES.LOADING) {
      AppStateModel.addLoadingRequest({payload, loaderSettings: opts.loaderSettings || {}});
    } else if ( payload.state === STATES.LOADED) {
      AppStateModel.removeLoadingRequest({payload, loaderSettings: opts.loaderSettings || {}});
    } else if ( payload.state === STATES.ERROR) {
      AppStateModel.removeLoadingRequest({payload, loaderSettings: opts.loaderSettings || {}});
      AppStateModel.addErrorRequest({payload, errorSettings: opts.errorSettings || {}});
    }
  }
}
