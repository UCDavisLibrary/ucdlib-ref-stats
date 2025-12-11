import { html } from 'lit';

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