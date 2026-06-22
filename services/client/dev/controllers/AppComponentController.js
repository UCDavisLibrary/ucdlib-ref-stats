import { Registry } from '@ucd-lib/cork-app-utils';

/**
 * @description Controller for app components
 * @property {HTMLElement} host - The host element
 * @property {String} parentPageId - The page-id of the application parent page (the direct child of ucdlib-pages element)
 * @property {HTMLElement} parentPage - The parent page element
 */
export default class AppComponentController {

  constructor(host){
    this.host = host;
    host.addController(this);
    this.AppStateModel = Registry.getModel('AppStateModel');

    this.parentPageId = null;
    this.parentPage = null;
  }

  /**
   * @description Whether the host element's parent page is the currently active page in the application
   * @returns {Boolean}
   */
  get isOnActivePage(){
    if ( !this.parentPageId || !this.AppStateModel?.store?.data?.page ) return false;
    return this.AppStateModel.store.data.page === this.parentPageId;
  }

  /**
   * @description Walk up the DOM to set the parent page on connect
   */
  hostConnected(){
    this._setParentPage();
  }

  /**
   * @description Walk up the DOM (including across shadow roots) to find and store the nearest ancestor with a page-id attribute
   * @returns {HTMLElement|Boolean} The parent page element, or false if not found
   */
  _setParentPage(){
    let el = this.host;
    while( el ) {
      const p = el.getAttribute('page-id');
      if ( p ){
        this.parentPageId = p;
        this.parentPage = el;
        return el;
      }
      if ( el.parentElement ){
        el = el.parentElement;
      } else if ( el.parentNode?.host ) {
        el = el.parentNode.host;
      } else {
        return false;
      }
    }
  }
}
