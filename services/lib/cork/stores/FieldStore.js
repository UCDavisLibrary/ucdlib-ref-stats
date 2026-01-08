import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class FieldStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      create: new LruStore({name: 'field.create'}),
    };
    this.events = {};
  }

}

const store = new FieldStore();
export default store;