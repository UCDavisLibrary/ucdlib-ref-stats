import { clearCache } from '@ucd-lib/cork-app-utils';

const defaultOpts = { 
  skipModels: ['IconModel', 'AppStateModel', 'AuthModel'], 
  skipStores: ['formentry.payload'] 
};

export default (opts={}) => {
  clearCache({ ...defaultOpts, ...opts });
}