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
  `;
}

function _renderFields(){
  if ( !this.formNameOrId ) return html``;
  return html`
    <div>
      ${this.fields.map( f => html`
        <div>
          <div>
            <a href="/field/${f.field.name}" class='ucd-link-list-item--title'>${f.field.label}</a>
            <div class='ucd-link-list-item--badge' ?hidden=${!f.assignment_is_archived}>Archived</div>
            <div class='ucd-link-list-item--badge' ?hidden=${!f.field.is_archived}>Field Archived</div>
          </div>
          <div class='ucd-link-list-item--excerpt'>${f.field.name}</div>
          <ul class='list--pipe actions text--smaller'>
            <li>
              <cork-icon icon='fas.eye-slash'></cork-icon>
              <button class='link-button'>Archive</button>
            </li>
            <li>
              <cork-icon icon='fas.trash'></cork-icon>
              <button class='link-button'>Delete</button>
            </li>
          </ul>
        </div>
        `)}
    </div>
  `;
}