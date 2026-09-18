import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-new-student-assistant-form {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
  <section class='panel--icon-redbud'>
    <h2 class="panel__title panel__title--cork"><span class="panel__custom-icon"><cork-icon icon="fas.user-graduate"></cork-icon></span>Grant Access</h2>
    <form @submit="${this._onSubmit}" novalidate>
      <cork-field-container schema='student-assistant' path='user_id' class='field-container'>
        <label>Student Assistants</label>
        <ucd-theme-slim-select @change=${e => this._onPayloadInput('user_id', e.detail?.length ? e.detail.map(o => o.value) : [])}>
          <select multiple>
            ${this.activeAppointments.map(person => html`
              <option value="${person.userId}" ?selected=${this.payload.user_id?.includes(person.userId)}>
                ${person.name} (${person.email})
              </option>
            `)}
          </select>
        </ucd-theme-slim-select>
      </cork-field-container>
      <cork-field-container schema='student-assistant' path='group_id' class='field-container'>
        <label>Department</label>
        <ucd-theme-slim-select @change=${e => this._onPayloadInput('group_id', e.detail?.value)}>
          <select>
            <option value="" ?selected=${!this.payload.group_id}>-- Select a Department --</option>
            ${this.groups.map(group => html`
              <option value=${group.group_id} ?selected=${this.payload.group_id == group.group_id}>
                ${group.name}
              </option>
            `)}
          </select>
        </ucd-theme-slim-select>
      </cork-field-container>
      <cork-field-container schema='student-assistant' path='form_id' class='field-container' ?hidden=${this.formNameOrId}>
        <label>Forms</label>
        <ucd-theme-slim-select @change=${e => this._onPayloadInput('form_id', e.detail?.length ? e.detail.map(o => o.value) : [])}>
          <select multiple>
            ${this.forms.map(form => html`
              <option value="${form.name}" ?selected=${this.payload.form_id?.includes(form.name)}>
                ${form.label}
              </option>
            `)}
          </select>
        </ucd-theme-slim-select>
      </cork-field-container>
      <button type="submit" class='btn btn--primary btn--block'>Submit</button>
    </form>
  </section>
  `;}