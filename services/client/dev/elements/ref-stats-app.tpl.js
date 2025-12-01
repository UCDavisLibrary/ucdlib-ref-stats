import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
return html`
  ${renderHeader.call(this)}
  <p>hello world</p>
`;}

function renderHeader(){
  return html`
    <ucd-theme-header>
      <ucdlib-branding-bar
        site-name="UC Davis Library"
        slogan="Reference Statistics">
      </ucdlib-branding-bar>

      <ucd-theme-primary-nav>
      </ucd-theme-primary-nav>
    </ucd-theme-header>
  `;
}