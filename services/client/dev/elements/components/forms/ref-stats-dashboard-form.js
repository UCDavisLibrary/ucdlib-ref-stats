import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-dashboard-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AppComponentController } from '#controllers';
import { IdGenerator } from '#client-utils';

/**
 * @description Form element for creating and editing a dashboard definition.
 * Handles create, update, and delete operations, including form associations and
 * advanced Superset configuration (restricted to admins).
 * @property {String} nameOrId - The name or ID of the dashboard being edited, or null for a new dashboard
 * @property {Object} payload - The current form data payload bound to the form inputs
 * @property {Array} allForms - All available forms for the multi-select association picker
 */
export default class RefStatsDashboardForm extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      nameOrId: {type: String},
      payload: {type: Object},
      allForms: {type: Array}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.nameOrId = null;
    this.payload = {};
    this.allForms = [];

    this.ctl = {
      appComponent: new AppComponentController(this),
      idGen: new IdGenerator()
    }

    this._injectModel('AppStateModel', 'DashboardModel', 'FormModel', 'AuthModel');
  }

  /**
   * @description Responds to app state changes. Sets nameOrId from the URL path
   * and fetches data when the component's page is active.
   * @param {Object} e - App state update event containing location information
   */
  async _onAppStateUpdate(e) {
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    this.nameOrId = e.location.path[1] === 'new' ? null : e.location.path[1];
    await this.getData();
  }

  /**
   * @description Fetches the dashboard data and all available forms.
   * Resets the payload before fetching. Does nothing for the dashboard if nameOrId is not set.
   */
  async getData() {
    this.payload = {};

    const [formsRes, dashRes] = await Promise.all([
      this.FormModel.getAllForms(),
      this.nameOrId ? this.DashboardModel.get(this.nameOrId) : Promise.resolve(null)
    ]);

    if ( formsRes?.state === 'loaded' ) {
      this.allForms = Array.isArray(formsRes.payload) ? formsRes.payload : [];
    }

    if ( dashRes?.state === 'loaded' ) {
      this.payload = {...dashRes.payload};
      this.payload._superset_dashboard_ui_config = this.payload.superset_dashboard_ui_config ? JSON.stringify(this.payload.superset_dashboard_ui_config, null, 2) : '{}'
    }
  }

  /**
   * @description Updates a single property on the payload and requests a re-render.
   * @param {String} prop - The payload property name to update
   * @param {*} value - The new value for the property
   */
  _onPayloadInput(prop, value) {
    this.payload[prop] = value;
    this.requestUpdate();
  }

  /**
   * @description Updates a property within the nested superset_rls object.
   * Creates superset_rls as an empty object if it does not yet exist.
   * @param {String} prop - The superset_rls key to update
   * @param {*} value - The new value for the key
   */
  _onRlsInput(prop, value) {
    if ( !this.payload.superset_rls ) this.payload.superset_rls = {};
    this.payload.superset_rls[prop] = value;
    this.requestUpdate();
  }

  /**
   * @description Handles form submission. Creates or patches the dashboard depending
   * on whether nameOrId is set. Fires a `ref-stats-dashboard-updated` custom event on success.
   * @param {Event} e - The form submit event
   * @returns {Object|undefined} The model response if there is a 422 validation error
   */
  async _onSubmit(e) {
    e.preventDefault();

    const rls = this.payload.superset_rls || {};
    const submitPayload = {
      ...this.payload,
      superset_rls: {
        ...rls,
        applyToRoles: this._splitRoles(rls.applyToRoles),
        applyIfMissingRoles: this._splitRoles(rls.applyIfMissingRoles)
      }
    };
    if ( !this.payload._superset_dashboard_ui_config ) {
      submitPayload.superset_dashboard_ui_config = {};
    } else {
      try {
        submitPayload.superset_dashboard_ui_config = JSON.parse(this.payload._superset_dashboard_ui_config);
      } catch (e) {
        this.AppStateModel.showToast({text: 'Unable to save. Invalid JSON in dashboardUiConfig', type: 'error'});
        return;
      }
    }

    let r;
    if ( this.nameOrId ) {
      r = await this.DashboardModel.patch(submitPayload);
    } else {
      r = await this.DashboardModel.create(submitPayload);
    }
    if ( r?.payload?.error?.response?.status == 422 ) return r;

    if ( r.state === 'loaded' ) {
      const toastText = this.nameOrId ? 'Dashboard updated successfully' : 'Dashboard created successfully';
      this.AppStateModel.showToast({text: toastText, type: 'success'});
      this.dispatchEvent(new CustomEvent('ref-stats-dashboard-updated', {
        detail: {dashboard: r.payload, newDashboard: !this.nameOrId},
        bubbles: true,
        composed: true
      }));
    }
  }

  /**
   * @description Opens a confirmation dialog before deleting the dashboard.
   */
  _onDeleteRequest() {
    this.AppStateModel.showDialogModal({
      title: 'Delete Dashboard',
      content: () => 'Are you sure you want to delete this dashboard? This action cannot be undone. To retain the dashboard, archive it instead.',
      actions: [
        {text: 'Close', value: 'dismiss', invert: true, color: 'secondary'},
        {text: 'Delete', color: 'double-decker', value: 'dashboard-delete'}
      ]
    });
  }

  /**
   * @description Handles dialog action events. Deletes the dashboard when the user confirms.
   * @param {Object} e - Dialog action event with an `action` property
   */
  async _onAppDialogAction(e) {
    if ( e.action.value !== 'dashboard-delete' ) return;
    const r = await this.DashboardModel.delete(this.nameOrId);
    if ( r?.state === 'loaded' ) {
      this.AppStateModel.showToast({text: 'Dashboard deleted successfully', type: 'success'});
      this.dispatchEvent(new CustomEvent('ref-stats-dashboard-updated', {
        detail: {dashboard: r.payload, deleted: true},
        bubbles: true,
        composed: true
      }));
    }
  }

  /**
   * @description Splits a comma-separated roles string into a trimmed array.
   * Returns an empty array for falsy input.
   * @param {String} value - Comma-separated role names
   * @returns {Array<String>}
   */
  _splitRoles(value) {
    if ( !value ) return [];
    if ( Array.isArray(value) ) return value;
    return value.split(',').map(s => s.trim()).filter(Boolean);
  }

  /**
   * @description Joins an array of role strings back into a comma-separated display string.
   * Returns an empty string for falsy or empty arrays.
   * @param {Array<String>|String} value - Role array or existing string value
   * @returns {String}
   */
  _joinRoles(value) {
    if ( !value ) return '';
    if ( Array.isArray(value) ) return value.join(', ');
    return value;
  }

}

customElements.define('ref-stats-dashboard-form', RefStatsDashboardForm);
