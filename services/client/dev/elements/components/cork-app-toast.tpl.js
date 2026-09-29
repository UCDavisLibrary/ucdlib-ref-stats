import { html, css } from 'lit';
import brandColorStyles from '@ucd-lib/theme-sass/4_component/_category-brand.css.js';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
      position: fixed;
      bottom: 2rem;
      left: 2rem;
      z-index: 1001;
      margin-right: 2rem;
      max-width: 600px;
    }
    [hidden] {
      display: none !important;
    }
    .container {
      padding: 1rem 1.5rem;
      border-radius: 5rem;
      background-color: var(--ucd-blue-40, #dbeaf7);
      box-shadow: 0px 3px 8px 0px rgba(0, 0, 0, 0.20);
      font-size: 1rem;
    }
    .toast-content {
      display: flex;
      align-items: center;
      gap: .5rem;
    }
    .toast-link {
      display: block;
      font-size: .875rem;
      color: var(--ucd-blue-80, #13639e);
    }
    .toast-link:hover, .toast-link:focus, .toast-link:visited {
      color: var(--ucd-blue-80, #13639e);
    }
    .has-icon .toast-link {
      margin-left: 1.5rem;
    }
  `;

  return [
    brandColorStyles,
    elementStyles
  ];
}

export function render() {
return html`
  <div class='container ${this.currentToast?.icon ? 'has-icon' : ''}' ?hidden=${!this.currentToast}>
    <div class='toast-content'>
      <cork-icon icon=${this.currentToast?.icon} class=${this.currentToast?.brandColor} ?hidden=${!this.currentToast?.icon}></cork-icon>
      <div>${this.currentToast?.text}</div>
    </div>
    ${this.currentToast?.link ? html`<a class='toast-link' href=${this.currentToast.link?.href}>${this.currentToast.link?.text}</a>` : html``}
  </div>
`;}
