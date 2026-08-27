import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-dashboard-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AppComponentController } from '#controllers';
import { IdGenerator } from '#client-utils';
import AccessToken from '#lib/AccessToken.js';

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
   * @description Maps the dashboard's currently-linked forms to their form-manager--<slug> role
   * names. Falls back to the loaded `payload.forms` join data if `form_ids` hasn't been touched yet.
   * @returns {Array<String>}
   */
  _linkedFormManagerRoleNames() {
    const formIds = this.payload.form_ids ?? (this.payload.forms || []).map(f => f.form_id);
    return this.allForms
      .filter(f => formIds.includes(f.form_id))
      .map(f => `${AccessToken.FORM_MANAGER_ROLE_PREFIX}${f.name}`);
  }

  /**
   * @description Returns the "Other roles" portion of an RLS role array for display: everything
   * except the Admin role, the Manager role, and any form-manager--<slug> roles.
   * @param {Array<String>} roles
   * @returns {String} Comma-separated role names
   */
  _otherRolesString(roles) {
    return (roles || [])
      .filter(r => r !== AccessToken.ADMIN_ROLE && r !== AccessToken.MANAGER_ROLE && !r.startsWith(AccessToken.FORM_MANAGER_ROLE_PREFIX))
      .join(', ');
  }

  /**
   * @description Toggles the Admin or Form Manager role in an RLS role array (applyToRoles/
   * applyIfMissingRoles). Form Manager also grants the current form-manager--<slug> role for
   * every form linked to this dashboard.
   * @param {String} listProp - 'applyToRoles' or 'applyIfMissingRoles'
   * @param {'admin'|'formManager'} roleType
   * @param {Boolean} checked
   */
  _onRlsRoleCheckbox(listProp, roleType, checked) {
    if ( !this.payload.superset_rls ) this.payload.superset_rls = {};
    const roles = this.payload.superset_rls[listProp] || [];

    let next;
    if ( roleType === 'admin' ) {
      next = checked
        ? [...new Set([...roles, AccessToken.ADMIN_ROLE])]
        : roles.filter(r => r !== AccessToken.ADMIN_ROLE);
    } else {
      const withoutFormManager = roles.filter(r => r !== AccessToken.MANAGER_ROLE && !r.startsWith(AccessToken.FORM_MANAGER_ROLE_PREFIX));
      next = checked
        ? [...withoutFormManager, AccessToken.MANAGER_ROLE, ...this._linkedFormManagerRoleNames()]
        : withoutFormManager;
    }

    this.payload.superset_rls[listProp] = next;
    this.requestUpdate();
  }

  /**
   * @description Updates the freeform "Other roles" portion of an RLS role array, preserving
   * any Admin/Manager/form-manager roles already present.
   * @param {String} listProp - 'applyToRoles' or 'applyIfMissingRoles'
   * @param {String} value - Comma-separated "other roles" text input value
   */
  _onRlsOtherRolesInput(listProp, value) {
    if ( !this.payload.superset_rls ) this.payload.superset_rls = {};
    const roles = this.payload.superset_rls[listProp] || [];
    const structured = roles.filter(r => r === AccessToken.ADMIN_ROLE || r === AccessToken.MANAGER_ROLE || r.startsWith(AccessToken.FORM_MANAGER_ROLE_PREFIX));
    this.payload.superset_rls[listProp] = [...structured, ...this._splitRoles(value)];
    this.requestUpdate();
  }

  /**
   * @description Updates the dashboard's linked forms and, for any RLS role list with the Form
   * Manager role active, rebuilds its form-manager--<slug> entries to match the new form set.
   * @param {Array<String>} formIds - New array of linked form UUIDs
   */
  _onFormIdsChange(formIds) {
    this.payload.form_ids = formIds;
    const linkedRoleNames = this._linkedFormManagerRoleNames();

    for ( const listProp of ['applyToRoles', 'applyIfMissingRoles'] ) {
      const roles = this.payload.superset_rls?.[listProp] || [];
      if ( !roles.includes(AccessToken.MANAGER_ROLE) ) continue;
      const withoutFormManagerRoles = roles.filter(r => r === AccessToken.MANAGER_ROLE || !r.startsWith(AccessToken.FORM_MANAGER_ROLE_PREFIX));
      this.payload.superset_rls[listProp] = [...withoutFormManagerRoles, ...linkedRoleNames];
    }

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

    const submitPayload = { ...this.payload };
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

}

customElements.define('ref-stats-dashboard-form', RefStatsDashboardForm);
