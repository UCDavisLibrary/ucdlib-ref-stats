import {BaseModel} from '@ucd-lib/cork-app-utils';
import ValidationStore from '../stores/ValidationStore.js';

class ValidationModel extends BaseModel {

  constructor() {
    super();

    this.store = ValidationStore;

    this.register('ValidationModel');
  }

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
}

const model = new ValidationModel();
export default model;
