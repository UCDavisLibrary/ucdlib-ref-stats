import {BaseStore} from '@ucd-lib/cork-app-utils';

class ValidationStore extends BaseStore {

  constructor() {
    super();

    this.data = {};
    this.events = {
      'VALIDATION_ERROR': 'validation-error',
      'VALIDATION_SUCCESS': 'validation-success'
    };
  }

}

const store = new ValidationStore();
export default store;
