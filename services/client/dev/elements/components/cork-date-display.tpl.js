import { html, css, unsafeCSS } from 'lit';

export function styles() {
  const elementStyles = css`
    :host {
      display: block;
      container-type: inline-size;
    }
    [hidden] {
      display: none !important;
    }
    .container {
      display: flex;
      flex-direction: row;
      gap: 0.5rem;
      align-items: baseline;
    }
  `;

  return [elementStyles];
}

export function render() { 
return html`
  ${_renderBreakpoint.call(this)}
  <div class='container'>
    <div class='date' ?hidden=${this.timeOnly}>${this._dateString}</div>
    <div class='time' ?hidden=${this.dateOnly}>${this._timeString}</div>
  </div>
`;}

function _renderBreakpoint(){
  const css = `
    @container (max-width: ${this.breakpoint}) {
      .container {
        flex-direction: column !important;
        align-items: flex-start !important;
        gap: 0 !important;
      }
    }
  `;
  return html`<style>${unsafeCSS(css)}</style>`;
}

