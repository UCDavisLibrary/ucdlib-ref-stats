// all global styles should be imported here
import sharedStyles from '@ucd-lib/theme-sass/style-ucdlib.css';
import brandCssProps from '@ucd-lib/theme-sass/css-properties.css';
import fonts from './fonts.css';
import headings from './headings.css';

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

  ${sharedStyles}
  ${brandCssProps}
  ${fonts}
  ${headings}
`;

let sharedStyleElement = document.createElement('style');
sharedStyleElement.innerHTML = styles;
document.head.appendChild(sharedStyleElement);
