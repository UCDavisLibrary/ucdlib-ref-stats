import {BaseModel} from '@ucd-lib/cork-app-utils';
import GroupService from '../services/GroupService.js';
import GroupStore from '../stores/GroupStore.js';

class GroupModel extends BaseModel {

  constructor() {
    super();

    this.store = GroupStore;
    this.service = GroupService;

    this.register('GroupModel');
  }

  /**
   * @description Get a simple list of all groups
   * @param {Object} opts - Query options (e.g. active_only)
   * @returns {Promise}
   */
  async getAllGroups(opts={}) {
    return this.service.getAll(opts);
  }

}

const model = new GroupModel();
export default model;
