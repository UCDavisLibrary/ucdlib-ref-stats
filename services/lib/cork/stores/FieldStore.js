import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class FieldStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      create: new LruStore({name: 'field.create'}),
      query: new LruStore({name: 'field.query'}),
      get: new LruStore({name: 'field.get'}),
      patch: new LruStore({name: 'field.patch'}),
      delete: new LruStore({name: 'field.delete'})
    };
    this.events = {};
  }

}

const store = new FieldStore();
export default store;