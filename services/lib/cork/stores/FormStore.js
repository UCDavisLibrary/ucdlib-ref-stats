import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class FormStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      create: new LruStore({name: 'form.create'}),
      query: new LruStore({name: 'form.query'}),
      get: new LruStore({name: 'form.get'}),
      patch: new LruStore({name: 'form.patch'}),
      delete: new LruStore({name: 'form.delete'})
    };
    this.events = {};
  }

}

const store = new FormStore();
export default store;