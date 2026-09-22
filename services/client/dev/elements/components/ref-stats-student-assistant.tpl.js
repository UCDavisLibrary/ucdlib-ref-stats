import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-student-assistant {
      display: block;
      container-type: inline-size;
      padding: 1rem;
      margin-bottom: 1rem;
      border-left: 1px solid var(--ucd-gold, #ffbf00);
      box-shadow: 0 0 10px 0 rgba(0,0,0,.1);
      --cork-icon-button-size: 2rem;
    }
    ref-stats-student-assistant .student-assistant__heading {
      display: flex;
      margin-bottom: .5rem;
      gap: .75rem;
      flex-direction: column-reverse;
    }
    ref-stats-student-assistant .student-assistant__name {
      margin-bottom: 0;
    }
    ref-stats-student-assistant .student-assistant__identifiers {
      display: flex;
      font-size: .875rem;
      color: var( --gray, #4c4c4c);
      flex-direction: column;
    }
    ref-stats-student-assistant .student-assistant__identifiers .separator {
      display: none;
    }
    ref-stats-student-assistant .student-assistant__detail .colon {
      display: none;
    }
    ref-stats-student-assistant .student-assistant__detail {
      display: block;
      margin-bottom: .25rem;
    }
    ref-stats-student-assistant .student-assistant__details {
      font-size: .875rem;
    }
    ref-stats-student-assistant .student-assistant__detail > div:first-child {
      font-weight: 700;
      color: var(--ucd-blue, #022851);
    }
    @container (min-width: 400px) {
      ref-stats-student-assistant .student-assistant__heading {
        flex-direction: row;
        justify-content: space-between;
      }
      ref-stats-student-assistant .student-assistant__identifiers .separator {
        display: block;
      }
      ref-stats-student-assistant .student-assistant__identifiers {
        flex-direction: row;
        flex-wrap: wrap;
        align-items: center;
        gap: .25rem;
      }
      ref-stats-student-assistant .student-assistant__detail {
        display: flex;
        align-items: center;
        gap: .5rem;
        margin-bottom: 0;
      }
      ref-stats-student-assistant .student-assistant__detail.expanded {
        align-items: flex-start;
      }
      ref-stats-student-assistant .student-assistant__detail .colon {
        display: inline;
      }
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div>
      <div class='student-assistant__heading'>
        <div>
          <div class='student-assistant__name h5'>${this.data?.first_name} ${this.data?.last_name}</div>
          <div class='student-assistant__identifiers'>
            <div>${this.data?.user_id}</div>
            <div class='separator'>|</div>
            <div>${this.data?.email}</div>
          </div>
        </div>
        <div class='student-assistant__actions'>
          <cork-icon-button 
            icon='fas.cloud-arrow-up' 
            title='Sync Roles'
            @click=${this._onSyncClick}
            link-aria-label='Sync Roles for ${this.data?.first_name} ${this.data?.last_name}'></cork-icon-button>
          <cork-icon-button 
            icon=${this.formNameOrId ? 'fas.trash' : 'fas.pen-to-square'} 
            title=${this.formNameOrId ? 'Remove Form Access' : 'Edit Form Access'}
            @click=${this._onRemoveClick}
            link-aria-label=${this.formNameOrId ? 'Remove Form Access for ${this.data?.first_name} ${this.data?.last_name}' : 'Edit Form Access for ${this.data?.first_name} ${this.data?.last_name}'}></cork-icon-button>
        </div>
      </div>
      <div class='student-assistant__details'>
        <div class='student-assistant__detail'>
          <div>Department<span class='colon'>:</span></div>
          <div>${this.data?.groups?.[0]?.name || 'N/A'}</div>
        </div>
        <div class='student-assistant__detail'>
          <div>Appointment Status<span class='colon'>:</span></div>
          <div ?hidden=${!this.loadingAppointment}>Loading...</div>
          <div ?hidden=${this.loadingAppointment}>
            ${this.appointment ? 
              html`<span class='redwood'>Active</span>` : 
              html`<span class='double-decker'>Inactive</span><button class='link-button u-space-ml--small' @click=${this._onRemoveClick} aria-label='Remove ${this.data?.first_name} ${this.data?.last_name}'>Remove</button>`}
          </div>
        </div>
        <div class='student-assistant__detail ${this.showFormList ? 'expanded' : ''}' ?hidden=${this.formNameOrId}>
          <div>Form Access<span class='colon'>:</span></div>
          <div ?hidden=${this.showFormList}>
            <span>${this.data?.forms?.length || 0}</span>
            <button class='link-button u-space-ml--small' @click=${() => this.showFormList = true} aria-label='Show form access for ${this.data?.first_name} ${this.data?.last_name}'>Show Forms</button>
          </div>
          <div ?hidden=${!this.showFormList}>
            ${this.data?.forms?.map(f => html`<div>${f.label}</div>`)}
            <button class='link-button' @click=${() => this.showFormList = false} aria-label='Hide form access for ${this.data?.first_name} ${this.data?.last_name}'>Hide Forms</button>
          </div>
        </div>
      </div>
    </div>
  `;}

  export function renderRemoveAccessDialog() {
    if ( this.formNameOrId ){
      const formLabel = this.data?.forms?.find(f => (f.name || f.form_id) === this.formNameOrId)?.label || this.formNameOrId;
      return html`
        <div>Are you sure you want to remove access to the form <b>${formLabel}</b> for <b>${this.data?.first_name} ${this.data?.last_name}</b>?</div>
      `;
    }
    return html`
      <p>Update form access for <b>${this.data?.first_name} ${this.data?.last_name}</b></p>
      <cork-field-container class='field-container u-space-mb--vast'>
        <label>Forms</label>
        <ucd-theme-slim-select @change=${e => this.accessPayload = e.detail?.length ? e.detail.map(o => o.value) : []}>
          <select multiple>
            ${this.forms.map(form => html`
              <option value="${form.name}" ?selected=${this.accessPayload?.includes(form.name)}>
                ${form.label}
              </option>
            `)}
          </select>
        </ucd-theme-slim-select>
      </cork-field-container>
    `;
  }