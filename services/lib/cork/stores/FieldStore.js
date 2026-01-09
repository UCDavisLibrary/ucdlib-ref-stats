import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class FieldStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      create: new LruStore({name: 'field.create'}),
      query: new LruStore({name: 'field.query'})
    };
    this.events = {};
  }

}

const store = new FieldStore();
export default store;