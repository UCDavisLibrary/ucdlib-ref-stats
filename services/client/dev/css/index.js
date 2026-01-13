// all global styles should be imported here
import sharedStyles from '@ucd-lib/theme-sass/style-ucdlib.css';
import brandCssProps from '@ucd-lib/theme-sass/css-properties.css';
import fonts from './fonts.css';
import headings from './headings.css';
import linkList from './link-list.css';
import typeahead from './typeahead.css';

import { styles as corkFieldContainerStyles } from '#components/cork-field-container.tpl.js';
import { styles as picklistTypeaheadStyles } from '#components/ref-stats-picklist-typeahead.tpl.js';
import { styles as formTypeaheadStyles } from '#components/ref-stats-form-typeahead.tpl.js';

function getLitStyles(styles){
  return styles().map(s => s.cssText).join('\n');
}

const styles = `
  ${sharedStyles}
  ${brandCssProps}
  ${fonts}
  ${headings}
  ${linkList}
  ${typeahead}
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
  @media (max-width: 991px) {
    .l-davis-flipped * > * > :last-child {
      margin-bottom: revert;
    }
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
  button.link-button {
    all: unset;
    color: var(--ucd-blue-80, #13639E);
    text-decoration: underline;
    cursor: pointer;
  }
  button.link-button:hover {
    color: var(--tahoe, #00b2e3);
  }
  .badge {
    display: inline-block;
    font-size: .875rem;
    margin-bottom: .5rem;
    padding: .1rem .5rem;
    background-color: #dbeaf7;
    border-radius: .5rem;
    color: #fff;
  }
  ${getLitStyles(corkFieldContainerStyles)}
  ${getLitStyles(picklistTypeaheadStyles)}
  ${getLitStyles(formTypeaheadStyles)}
`;

let sharedStyleElement = document.createElement('style');
sharedStyleElement.innerHTML = styles;
document.head.appendChild(sharedStyleElement);
