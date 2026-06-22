import { getLogger } from '@ucd-lib/cork-app-utils';

const bundles = [
  { 
    name: 'admin',
    pages: ['picklist', 'picklist-single', 'field', 'field-single', 'form-admin', 'form-admin-single']
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

  /**
   * @description Loads the JS bundle associated with the given page name, if one exists.
   * @param {String} page - The page name to look up
   * @returns {Promise}
   */
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

  /**
   * @description Dynamically imports a bundle by name. Marks the bundle as loaded to prevent duplicate imports.
   * @param {Object} bundle - The bundle descriptor object
   * @param {String} bundle.name - The bundle file name (without extension)
   * @param {Boolean} bundle.loaded - Whether the bundle has already been loaded
   * @returns {Promise}
   */
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