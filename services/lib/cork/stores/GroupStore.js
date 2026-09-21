import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

/**
 * @description Store for group API request state.
 */
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
