import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class DashboardStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      create: new LruStore({name: 'dashboard.create'}),
      query: new LruStore({name: 'dashboard.query'}),
      get: new LruStore({name: 'dashboard.get'}),
      patch: new LruStore({name: 'dashboard.patch'}),
      delete: new LruStore({name: 'dashboard.delete'}),
      all: new LruStore({name: 'dashboard.all'}),
      guestToken: new LruStore({name: 'dashboard.guestToken'})
    };
    this.events = {};
  }

}

const store = new DashboardStore();
export default store;
