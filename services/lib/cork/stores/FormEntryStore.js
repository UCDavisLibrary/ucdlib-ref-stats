import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class FormEntryStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      create: new LruStore({name: 'formentry.create'}),
      payload: new LruStore({name: 'formentry.payload'}),
      get: new LruStore({name: 'formentry.get'}),
      query: new LruStore({name: 'formentry.query'})
    };
    this.events = {};
  }

}

const store = new FormEntryStore();
export default store;