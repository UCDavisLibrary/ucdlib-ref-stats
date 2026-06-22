import {BaseModel} from '@ucd-lib/cork-app-utils';
import ValidationStore from '../stores/ValidationStore.js';

class ValidationModel extends BaseModel {

  constructor() {
    super();

    this.store = ValidationStore;

    this.register('ValidationModel');
  }

  /**
   * @description Emit a validation success or error event based on a cork-app-utils response
   * @param {String} schema - The schema name associated with the request (e.g. 'form', 'field')
   * @param {Object} corkEvent - The cork-app-utils response object
   */
  notify(schema, corkEvent) {
    if ( corkEvent.state === 'loaded' ){
      this.store.emit(this.store.events.VALIDATION_SUCCESS, { schema });
      return;
    }
    if (corkEvent.error?.payload?.validationError ){
      this.store.emit(this.store.events.VALIDATION_ERROR, { schema, payload: corkEvent.error.payload });
      return;
    }
  }

  /**
   * @description Dismiss all active validation messages
   */
  dismissAll(){
    this.store.emit(this.store.events.VALIDATION_SUCCESS, { allSchemas: true });
  }
}

const model = new ValidationModel();
export default model;
