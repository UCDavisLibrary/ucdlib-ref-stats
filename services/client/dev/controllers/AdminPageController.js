import { Registry } from '@ucd-lib/cork-app-utils';

export default class AdminPageController {

  constructor(host){
    this.host = host;
    host.addController(this);
    this.AppStateModel = Registry.getModel('AppStateModel');
    this.AuthModel = Registry.getModel('AuthModel');

    this.userCanAccess = null;
  }

  /**
   * @description Determines whether the current user can access the host page, setting
   * `userCanAccess` and showing an error if not. Beyond general manager access, grants
   * form-scoped managers access to their own form's "form-admin-single" and "student-assistant"
   * pages (the latter only when reached as a sub-route of form-admin, i.e. scoped to that form).
   * @param {Object} e - App state update event containing page and location
   */
  async _onAppStateUpdate(e) {
    if ( e.page !== this.host.pageId ) return;

    this.userCanAccess = this.AuthModel.token?.hasManagerAccess;

    if ( !this.userCanAccess && this.host.pageId === 'form-admin-single' ) {
      const formName = e.location.path[1];
      if ( formName && formName !== 'new' && this.AuthModel.token?.formManagerForms?.includes(formName) ) {
        this.userCanAccess = true;
      }
    }

    if ( !this.userCanAccess && this.host.pageId === 'student-assistant' && e.location.path[0] === 'form-admin' ) {
      const formName = e.location.path[1];
      if ( formName && this.AuthModel.token?.formManagerForms?.includes(formName) ) {
        this.userCanAccess = true;
      }
    }

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