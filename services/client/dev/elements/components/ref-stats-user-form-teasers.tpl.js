import { html, css } from 'lit';


export function styles() {
  const elementStyles = css`
    ref-stats-user-form-teasers {
      display: block;
      container-type: inline-size;
    }
    ref-stats-user-form-teasers .teaser-grid {
      display: grid;
      grid-template-columns: repeat(1, minmax(0, 1fr));
      gap: 1rem;
    }
    ref-stats-user-form-teasers .tile-link__title {
      text-shadow: none;
    }
    @container (min-width: 480px) {
      ref-stats-user-form-teasers .teaser-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
    @container (min-width: 768px) {
      ref-stats-user-form-teasers .teaser-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `;

  return [elementStyles];
}


export function render() { 
return html`
  <div class='teaser-grid'>
    ${this.forms.map(form => html`
      <a href='/form/${form.name}' class="tile-link category-brand--${form.form_display_settings?.brandColor || 'primary'} category-brand__background">
        <div class="tile-link__title">
          <h3 class="tile-link__title-heading">${form.label}</h3>
        </div>
        <div class="tile-link__description">
          <p>${form.description}</p>
        </div>
        <div class="tile-link__indicator">
          <svg aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="M504 256C504 119 393 8 256 8S8 119 8 256s111 248 248 248 248-111 248-248zm-448 0c0-110.5 89.5-200 200-200s200 89.5 200 200-89.5 200-200 200S56 366.5 56 256zm72 20v-40c0-6.6 5.4-12 12-12h116v-67c0-10.7 12.9-16 20.5-8.5l99 99c4.7 4.7 4.7 12.3 0 17l-99 99c-7.6 7.6-20.5 2.2-20.5-8.5v-67H140c-6.6 0-12-5.4-12-12z"></path>
          </svg>
        </div>
        <div class="tile-link__overlay"></div>
      </a>
      `)}
  </div>
`;}