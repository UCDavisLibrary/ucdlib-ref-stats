import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class FormEntryStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      payload: new LruStore({name: 'formentry.payload'})
    };
    this.events = {};
  }

}

const store = new FormEntryStore();
export default store;