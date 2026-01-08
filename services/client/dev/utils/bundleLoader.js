import { getLogger } from '@ucd-lib/cork-app-utils';

const bundles = [
  { 
    name: 'admin',
    pages: ['picklist', 'picklist-single', 'field', 'field-single']
   }
];

class BundleLoader {

  constructor(bundles=[]){
    this.logger = getLogger('BundleLoader');
    this.bundles = bundles.map( b => { 
      const loaded = false;
      return {...b, loaded}; 
    });
  }

  loadForPage(page){
    const bundle = this.bundles.find( b => b.pages?.includes(page) );
    if ( bundle ) {
      if ( !bundle.loaded ) {
        this.logger.info('Loading bundle for page', page);
      }
      return this._loadBundle(bundle);
    }
    return Promise.resolve(false);
  }

  _loadBundle(bundle){
    if ( bundle.loaded ) {
      return Promise.resolve(false);
    }
    bundle.loaded = true;

    this.logger.info('Loading bundle', bundle.name);
    try {

      return import(
        /* webpackChunkName: "[request]" */
        `../bundles/${bundle.name}.js`
      );
    } catch(e){
      this.logger.error('Error loading bundle', bundle.name, e);
      return Promise.resolve(false);
    }
  }
}


export default new BundleLoader(bundles);