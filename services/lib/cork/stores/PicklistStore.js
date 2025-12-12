import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class PicklistStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      create: new LruStore({name: 'picklist.create'}),
      query: new LruStore({name: 'picklist.query'})
    };
    this.events = {};
  }

}

const store = new PicklistStore();
export default store;