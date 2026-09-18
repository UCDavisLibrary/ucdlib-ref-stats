import { LitElement, html } from 'lit';
import {render, renderRemoveAccessDialog} from "./ref-stats-student-assistant.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { AppComponentController } from '#controllers';

export default class RefStatsStudentAssistant extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      data: { type: Object },
      formNameOrId: { type: String, attribute: 'form-name-or-id' },
      appointment: { state: true },
      showFormList: { state: true },
      accessPayload: { state: true },
      forms: { state: true },
      fetchingForms: { state: true }
    }
  }


  constructor() {
    super();
    this.render = render.bind(this);

    this.data = null;
    this.formNameOrId = null;
    this.appointment = null;
    this.showFormList = false;
    this.accessPayload = null;
    this.forms = [];

    this.ctl = {
      appComponent : new AppComponentController(this)
    }

    this._injectModel('AppStateModel', 'StudentAssistantModel', 'FormModel');
  }

  willUpdate(props){
    if ( props.has('data') ) {
      this.getAppointment();

      if ( this.data?.userId !== props.get('data')?.userId ) {
        this.showFormList = false;
      }
    }
  }

  async getAppointment() {
    if ( !this.data ) {
      this.appointment = null;
      return;
    }
    const res = await this.StudentAssistantModel.getActiveAppointments();
    if ( res?.state === 'loaded' ) {
      this.appointment = res.payload.find(person => person.userId === this.data.user_id) || null;
    }
  }

  async _onRemoveClick() {
    if ( this.fetchingForms ) return;
    if ( !this.formNameOrId ) {
      this.accessPayload = this.data.forms.map( f => {return f.name})
      this.fetchingForms = true;
      const r = await this.FormModel.getAllForms();
      if ( r?.state === 'loaded' ) {
        this.forms = r.payload;
      }
      this.fetchingForms = false;
    }
    this.AppStateModel.showDialogModal({
      title: this.formNameOrId ? 'Remove Form Access' : 'Edit Form Access',
      content: () => renderRemoveAccessDialog.call(this),
      data: {userId: this.data?.user_id},
      actions: [
        {text: 'Cancel', value: 'dismiss', invert: true, color: 'secondary'},
        { text: this.formNameOrId ? 'Remove' : 'Update', color: 'secondary', value: 'update-student-assistant-roles' }
      ]
    })

  }

  _onSyncClick() {
    this.AppStateModel.showDialogModal({
      title: 'Sync Student Assistant Roles',
      content: () => html`
        <div>This action will ensure that the form access roles in the UC Davis Library Identity Management system match the roles listed in this application for <b>${this.data?.first_name} ${this.data?.last_name}</b>.</div>
        <div class='u-space-mt'>Do you wish to proceed?</div>
      `,
      data: {userId: this.data?.user_id},
      actions: [
        {text: 'Close', value: 'dismiss', invert: true, color: 'secondary'},
        { text: 'Sync', color: 'secondary', value: 'sync-student-assistant-roles' }
      ]
    })
  }

  async _onAppDialogAction(e){
    if ( !this.ctl.appComponent.isOnActivePage ) return;
    if ( e.action.value === 'sync-student-assistant-roles' && e.data?.userId === this.data?.user_id ) {
      const r = await this.StudentAssistantModel.sync({ user_id: this.data.user_id });
      if ( r.state === 'loaded' ) {
        this.AppStateModel.showToast({text: 'Keycloak roles synced successfully', type: 'success'});
      }
      this.AppStateModel.refresh();
      return;
    }

    if ( e.action.value === 'update-student-assistant-roles' && e.data?.userId === this.data?.user_id ) {
      const formIds = this.formNameOrId
        ? (this.data.forms || [])
            .filter(f => f.name !== this.formNameOrId && f.form_id !== this.formNameOrId)
            .map(f => f.form_id)
        : (this.accessPayload || []);

      const r = await this.StudentAssistantModel.updateFormAccess({
        user_id: this.data.user_id,
        form_id: formIds
      });
      if ( r.state === 'loaded' ) {
        const kcError = r.payload?.keycloakSync?.error;
        this.AppStateModel.showToast({
          text: kcError ? 'Form access updated, but Keycloak sync failed. Try Sync Roles.' : 'Form access updated successfully',
          type: kcError ? 'error' : 'success'
        });
        this.AppStateModel.refresh();
        return;
      }
    }
  }

}

customElements.define('ref-stats-student-assistant', RefStatsStudentAssistant);