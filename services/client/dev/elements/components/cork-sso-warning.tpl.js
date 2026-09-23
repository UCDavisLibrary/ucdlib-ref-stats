import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    cork-sso-warning {
      display: block;
    }
  `;
  return [elementStyles];
}

export function render() {
  const minutes = Math.floor(this.secondsRemaining / 60);
  const seconds = this.secondsRemaining % 60;
  const mmss = `${minutes}:${String(seconds).padStart(2, '0')}`;
  return html`
    <p>Your session will expire in <strong>${mmss}</strong> and you will be logged out.</p>
    <p><strong>Renewing your session will reload this page. Any unsaved changes will be lost.</strong></p>
  `;
}
