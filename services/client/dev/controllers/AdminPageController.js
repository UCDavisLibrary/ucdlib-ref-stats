import { Registry } from '@ucd-lib/cork-app-utils';

export default class AdminPageController {

  constructor(host){
    this.host = host;
    host.addController(this);
    this.AppStateModel = Registry.getModel('AppStateModel');
    this.AuthModel = Registry.getModel('AuthModel');

    this.userCanAccess = null;
  }

  async _onAppStateUpdate(e) {
    if ( e.page !== this.host.pageId ) return;

    this.userCanAccess = this.AuthModel.token?.hasManagerAccess;
    if ( !this.userCanAccess ) {
      this.AppStateModel.showError({message: 'You do not have permission to access this page.'});
    }

    this.host.requestUpdate();
  }

  /**
   * @description Register event listeners when the host is connected to the DOM
   */
  hostConnected() {
    this.AppStateModel.EventBus.on('app-state-update', this._onAppStateUpdate.bind(this));
  }

  /**
   * @description Remove event listeners when the host is disconnected from the DOM
   */
  hostDisconnected() {
    this.AppStateModel.EventBus.off('app-state-update', this._onAppStateUpdate.bind(this));
  }
}