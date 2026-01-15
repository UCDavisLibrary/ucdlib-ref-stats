import { Registry } from '@ucd-lib/cork-app-utils';
import AppComponentController from './AppComponentController.js';

export default class FormEntryController {
  constructor(host, opts={}){

    this.host = host;
    host.addController(this);

    this.models = {
      AppStateModel: Registry.getModel('AppStateModel'),
      FormModel: Registry.getModel('FormModel')
    }

    this.appComponentController = new AppComponentController(host);

    this.form = {};
    this.formNameOrId = null;
  }

  get hostIsForm(){
    return this.host.tagName === 'REF-STATS-FORM-ENTRY';
  }

  get hostIsField(){
    return this.host.tagName === 'REF-STATS-FORM-ENTRY-FIELD';
  }


  async _onAppStateUpdate(e){
    if ( !this.appComponentController.isOnActivePage ) return;

    this.formNameOrId = e.location?.[1];

    if ( this.hostIsForm && this.formNameOrId ) {
      const r = await this.models.FormModel.get(this.formNameOrId);
      if ( r.state === 'loaded' ) {
        this.form = r.payload;
      } else {
        this.form = {};
      }
      
    }

    this.host.requestUpdate();

  }


  hostConnected() {
    this.models.AppStateModel.EventBus.on('app-state-update', this._onAppStateUpdate.bind(this));
  }

  hostDisconnected() {
    this.models.AppStateModel.EventBus.off('app-state-update', this._onAppStateUpdate.bind(this));
  }
}