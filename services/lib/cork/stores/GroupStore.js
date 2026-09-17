import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class GroupStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      all: new LruStore({name: 'group.all'})
    };
    this.events = {};
  }

}

const store = new GroupStore();
export default store;
