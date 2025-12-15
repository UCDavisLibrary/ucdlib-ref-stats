// all global styles should be imported here
import sharedStyles from '@ucd-lib/theme-sass/style-ucdlib.css';
import brandCssProps from '@ucd-lib/theme-sass/css-properties.css';
import fonts from './fonts.css';
import headings from './headings.css';

import { styles as corkFieldContainerStyles } from '../elements/components/cork-field-container.tpl.js';

function getLitStyles(styles){
  return styles().map(s => s.cssText).join('\n');
}

const styles = `
  [hidden] {
    display: none !important;
  }
  .bold {
    font-weight: 700;
  }
  .small {
    font-size: .875rem;
  }
  .no-wrap {
    white-space: nowrap;
  }
  .factoid cork-icon {
    --cork-icon-size: 2em;
  }
  .focal-link cork-icon {
    --cork-icon-size: 2rem;
  }
  @media (max-width: 767px) {
    .l-container--narrow.l-container--narrow-desktop {
      width: 92%;
    }
  }
  .field-description {
    font-size: 0.875rem;
    color: var(--ucd-black-60);
    margin-top: 0.25rem;
  }
  input[disabled],
  textarea[disabled] {
    background-color: #f0f0f0;
  }
  .ucd-link-list-item {
    display: flex;
    gap: .25rem;
  }
  .ucd-link-list-item + .ucd-link-list-item {
    margin-top: 1rem;
  }
  .ucd-link-list-item .ucd-link-list-item--title {
    display: inline-block;
    color: var(--ucd-blue-80, #13639E);
    text-decoration: none;
    font-weight: 700;
    font-size: 1rem;
    line-height: 1.6rem;
  }
  .ucd-link-list-item .ucd-link-list-item--title:hover {
    text-decoration: underline;
  }
  .ucd-link-list-item .ucd-link-list-item--icon {
    color: var(--category-brand, #73abdd);
    --cork-icon-size: 1rem;
    margin-top: 0.3rem;
  }
  .ucd-link-list-item .ucd-link-list-item--excerpt {
    display: block;
    color: var(--ucd-black-70, #4C4C4C);
    font-size: .875rem;
    line-height: 1.3rem;
    font-weight: 400;
  }

  ${sharedStyles}
  ${brandCssProps}
  ${fonts}
  ${headings}
  ${getLitStyles(corkFieldContainerStyles)}
`;

let sharedStyleElement = document.createElement('style');
sharedStyleElement.innerHTML = styles;
document.head.appendChild(sharedStyleElement);
