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

  ${sharedStyles}
  ${brandCssProps}
  ${fonts}
  ${headings}
  ${getLitStyles(corkFieldContainerStyles)}
`;

let sharedStyleElement = document.createElement('style');
sharedStyleElement.innerHTML = styles;
document.head.appendChild(sharedStyleElement);
