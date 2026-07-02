import {PayloadUtils} from '@ucd-lib/cork-app-utils'

const ID_ORDER = [
  'action', 'page', 'per_page', 'include_items', 'picklistId', 
  'q', 'form', 'idOrName', 'entryId', 'deleteAll', 'clearCache',
  'active_only', 'name', 'mine', 'form_filter'
];

let inst = new PayloadUtils({
  idParts: ID_ORDER
});

export default inst;