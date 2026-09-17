import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

class StudentAssistantStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      activeAppointments: new LruStore({name: 'studentAssistant.activeAppointments'}),
      create: new LruStore({name: 'studentAssistant.create'})
    };
    this.events = {};
  }

}

const store = new StudentAssistantStore();
export default store;
