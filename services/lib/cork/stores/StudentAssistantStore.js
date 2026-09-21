import {LruStore} from '@ucd-lib/cork-app-utils';
import BaseStore from './BaseStore.js';

/**
 * @description Store for student assistant API request state.
 */
class StudentAssistantStore extends BaseStore {

  constructor() {
    super();

    this.data = {
      activeAppointments: new LruStore({name: 'studentAssistant.activeAppointments'}),
      create: new LruStore({name: 'studentAssistant.create'}),
      query: new LruStore({name: 'studentAssistant.query'}),
      updateFormAccess: new LruStore({name: 'studentAssistant.updateFormAccess'}),
      sync: new LruStore({name: 'studentAssistant.sync'})
    };
    this.events = {};
  }

}

const store = new StudentAssistantStore();
export default store;
