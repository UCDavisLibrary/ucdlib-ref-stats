import { LitElement } from 'lit';
import {render, styles} from "./ref-stats-entry-delete-confirm-form.tpl.js";

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

import { ModalFormController } from '#controllers';
import { IdGenerator } from '#client-utils';


/**
 * @description Modal form for confirming deletion of a form entry.
 * If the entry has no prior revisions, shows a simple confirmation message.
 * If the entry has previous revisions, presents a radio choice between deleting
 * only the latest version (reverting to the previous) or deleting all versions.
 * On success, navigates to /form/:formNameOrId/entries (delete all) or
 * /form/:formNameOrId/:newLatestId (delete last only).
 * @property {String} formNameOrId - Form name or ID the entry belongs to
 * @property {String} entryId - The form_entry_id to delete (must be the latest version)
 * @property {String} deleteChoice - 'single' to delete just this version, 'all' to delete the chain
 * @property {Object} formEntry - The fetched form entry object
 */
export default class RefStatsEntryDeleteConfirmForm extends Mixin(LitElement)
  .with(LitCorkUtils, MainDomElement) {

  static get properties() {
    return {
      formNameOrId: { type: String, attribute: 'form-name-or-id' },
      entryId: { type: String, attribute: 'entry-id' },
      deleteChoice: { state: true },
      formEntry: { state: true }
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);

    this.formNameOrId = null;
    this.entryId = null;
    this.deleteChoice = 'single';
    this.formEntry = null;

    this.ctl = {
      modal: new ModalFormController(this, {
        title: 'Delete Submission',
        submitText: 'Delete',
        submitCallback: '_onSubmitClick'
      }),
      idGen : new IdGenerator()
    };

    this._injectModel('AppStateModel', 'FormEntryModel');
  }

  /**
   * @description Fetch the form entry when formNameOrId or entryId change.
   * @param {Map} props - Changed properties map
   */
  willUpdate(props) {
    if ( props.has('formNameOrId') || props.has('entryId') ) {
      this._fetchEntry();
    }
  }

  /**
   * @description Whether the entry has previous revisions (more than one version in the chain).
   * @returns {Boolean}
   */
  get hasRevisions() {
    return (this.formEntry?.versions?.length ?? 0) > 1;
  }

  /**
   * @description Fetch the form entry from the model. Uses cached data if available.
   */
  async _fetchEntry() {
    if ( !this.entryId || !this.formNameOrId ) return;
    const r = await this.FormEntryModel.get(this.entryId, this.formNameOrId);
    if ( r.state === 'loaded' ) {
      this.formEntry = r.payload;
      this.deleteChoice = 'single';
    }
  }

  /**
   * @description Delete the form entry and navigate on success.
   * @returns {Object} The model response object
   */
  async _onSubmitClick() {
    const deleteAll = this.deleteChoice === 'all';
    const r = await this.FormEntryModel.deleteLatest(this.entryId, { deleteAll });
    if ( r.state === 'loaded' ) {
      this.AppStateModel.showToast({ text: 'Submission deleted', type: 'success' });
      if ( r.payload.new_latest_id ) {
        this.AppStateModel.setLocation(`/form/${this.formNameOrId}/${r.payload.new_latest_id}`);
      } else {
        this.AppStateModel.setLocation(`/form/${this.formNameOrId}/entries`);
      }
    }
    return r;
  }

}

customElements.define('ref-stats-entry-delete-confirm-form', RefStatsEntryDeleteConfirmForm);
