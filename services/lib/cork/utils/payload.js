import {PayloadUtils} from '@ucd-lib/cork-app-utils'

const ID_ORDER = ['action', 'page', 'per_page', 'include_items', 'picklistId'];

let inst = new PayloadUtils({
  idParts: ID_ORDER
});

export default inst;