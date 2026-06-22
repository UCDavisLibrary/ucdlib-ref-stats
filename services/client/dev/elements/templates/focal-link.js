import { html } from 'lit';

/**
 * @description Renders a UC Davis branded focal-link element containing an icon and label text.
 * @param {Object} opts - Options object
 * @param {String} opts.text - Display text shown in the link body
 * @param {String} opts.icon - Cork-icon identifier for the focal link figure
 * @param {String} opts.href - URL the link points to (defaults to '#')
 * @param {String} opts.brandColor - Optional brand color suffix appended to the category-brand class
 * @returns {import('lit').TemplateResult}
 */
export default (opts={}) => {
  const text = opts.text || '';
  const icon = opts.icon || '';
  const href = opts.href || '#';
  const brandClass = opts.brandColor ? `category-brand--${opts.brandColor}` : '';

  return html`
    <a href="${href}" class="focal-link ${brandClass}">
      <div class="focal-link__figure focal-link__icon">
        <cork-icon icon="${icon}"></cork-icon>
      </div>
      <div class="focal-link__body">
        <strong>${text}</strong>
      </div>
    </a>
  `;
}