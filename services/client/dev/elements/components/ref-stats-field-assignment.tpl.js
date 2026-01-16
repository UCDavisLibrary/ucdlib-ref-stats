import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-field-assignment {
      display: block;
    }
    ref-stats-field-assignment .actions li {
      display: inline-flex;
      gap: .5rem;
      
    }
    ref-stats-field-assignment .actions cork-icon {
      --cork-icon-size: .9rem;
      color: var(--ucd-blue-70, #73abdd);
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    ${_renderFields.call(this)}
    ${_renderForms.call(this)}
  `;
}

function _renderForms(){
  if ( !this.fieldNameOrId ) return html``;
  return html`
    <div class='icon-header'>
      <cork-icon icon='fas.keyboard' class='redbud'></cork-icon>
      <h2 class='icon-header--title'>Forms</h2>
    </div>
    <div ?hidden=${this.forms.length > 0}>
      This field is not assigned to any forms.
    </div>
    <div>
      ${this.forms.map( form => html`
        <div class='u-space-mb--small'>
          <div>
            <a href="/form-admin/${form.name}" class='ucd-link-list-item--title'>${form.label}</a>
            <div class='ucd-link-list-item--badge' ?hidden=${!form.assignment_is_archived}>Archived</div>
            <div class='ucd-link-list-item--badge' ?hidden=${!form.is_archived}>Form Archived</div>
          </div>
          <div class='ucd-link-list-item--excerpt'>${form.name}</div>
          <ul class='list--pipe actions text--smaller'>
            <li ?hidden=${form.assignment_is_archived}>
              <cork-icon icon='fas.eye-slash'></cork-icon>
              <button class='link-button' @click=${() => this._onArchiveClick(form.form_id)}>Archive</button>
            </li>
            <li ?hidden=${!form.assignment_is_archived}>
              <cork-icon icon='fas.eye'></cork-icon>
              <button class='link-button' @click=${() => this._onUnarchiveClick(form.form_id)}>Unarchive</button>
            </li>
            <li>
              <cork-icon icon='fas.trash'></cork-icon>
              <button class='link-button' @click=${() => this._onRemoveFieldClick(form.form_id)}>Remove</button>
            </li>
          </ul>
        </div>
      `)}
    </div>
    <div class="alignable-promo__buttons category-brand--redbud u-space-mt--medium">
      <button class="btn btn--invert u-space-mx--flush" @click=${this._onAddFieldClick}>Add This Field To New Form</button>
    </div>
  `;
}

function _renderFields(){
  if ( !this.formNameOrId ) return html``;
  return html`
    <div class='icon-header'>
      <cork-icon icon='fas.keyboard' class='redbud'></cork-icon>
      <h2 class='icon-header--title'>Form Fields</h2>
    </div>
    <div ?hidden=${this.fields.length > 0}>
      No fields assigned to this form.
    </div>
    <div>
      ${this.fields.map( f => html`
        <div class='u-space-mb--small'>
          <div>
            <a href="/field/${f.field.name}" class='ucd-link-list-item--title'>${f.field.label}</a>
            <div class='ucd-link-list-item--badge' ?hidden=${!f.assignment_is_archived}>Archived</div>
            <div class='ucd-link-list-item--badge' ?hidden=${!f.field.is_archived}>Field Archived</div>
          </div>
          <div class='ucd-link-list-item--excerpt'>${f.field.name}</div>
          <ul class='list--pipe actions text--smaller'>
            <li ?hidden=${f.assignment_is_archived}>
              <cork-icon icon='fas.eye-slash'></cork-icon>
              <button class='link-button' @click=${() => this._onArchiveClick(f.field.form_field_id)}>Archive</button>
            </li>
            <li ?hidden=${!f.assignment_is_archived}>
              <cork-icon icon='fas.eye'></cork-icon>
              <button class='link-button' @click=${() => this._onUnarchiveClick(f.field.form_field_id)}>Unarchive</button>
            </li>
            <li>
              <cork-icon icon='fas.trash'></cork-icon>
              <button class='link-button' @click=${() => this._onRemoveFieldClick(f.field.form_field_id)}>Remove</button>
            </li>
          </ul>
        </div>
        `)}
    </div>
    <div class="alignable-promo__buttons category-brand--redbud u-space-mt--medium">
      <button class="btn btn--invert u-space-mx--flush" @click=${this._onAddFieldClick}>Add Field To Form</button>
    </div>
  `;
}