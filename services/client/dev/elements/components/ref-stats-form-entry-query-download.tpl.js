import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-form-entry-query-download {
      display: inline-block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  const disable = this.totalCount === 0 || this.isDownloading;
  let text = 'Download submissions (CSV)';
  if ( this.isDownloading ) {
    text = 'Downloading...';
  } else if ( this.totalCount === 1 ){
    text = 'Download 1 submission (CSV)';
  } else if ( this.totalCount > 1 ) {

    text = `Download ${this.totalCount.toLocaleString()} submissions (CSV)`;
  }
  return html`
    <cork-prefixed-icon-button 
      icon='fas.download' 
      ?disabled=${disable} 
      @click=${this._onDownloadClick}
      .text=${text}>
    </cork-prefixed-icon-button>
`;}