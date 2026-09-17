import {BaseModel} from '@ucd-lib/cork-app-utils';
import StudentAssistantService from '../services/StudentAssistantService.js';
import StudentAssistantStore from '../stores/StudentAssistantStore.js';

class StudentAssistantModel extends BaseModel {

  constructor() {
    super();

    this.store = StudentAssistantStore;
    this.service = StudentAssistantService;

    this.register('StudentAssistantModel');
  }

  /**
   * @description Get the list of currently active student assistant appointments
   * @returns {Promise}
   */
  async getActiveAppointments() {
    return this.service.getActiveAppointments();
  }

  /**
   * @description Grant student assistants access to one or more forms for a group
   * @param {Object} data - {user_id: String[], form_id: String[], group_id: Number}
   * @returns {Promise}
   */
  async create(data) {
    return this.service.create(data);
  }

}

const model = new StudentAssistantModel();
export default model;
