import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class PicklistStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      create: new LruStore({name: 'picklist.create'}),
      query: new LruStore({name: 'picklist.query'}),
      get: new LruStore({name: 'picklist.get'}),
      patch: new LruStore({name: 'picklist.patch'}),
      delete: new LruStore({name: 'picklist.delete'})
    };
    this.events = {};
  }

}

const store = new PicklistStore();
export default store;