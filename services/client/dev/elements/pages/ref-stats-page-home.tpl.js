import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-page-home {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div class='l-container u-space-mt--large'>
      <h1>Home Page</h1>
    </div>
  `;
}