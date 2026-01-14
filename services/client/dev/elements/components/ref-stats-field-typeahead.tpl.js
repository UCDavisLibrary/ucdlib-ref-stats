import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-field-typeahead {
      display: block;
    }
  `;

  return [elementStyles];
}

export function render() { 
  return html`
    <div class="typeahead-container">
      <input
        id=${this.inputId || ''}
        type="text"
        placeholder="Start typing to search fields..."
        .value=${this.value}
        @input=${this._onValueInput}
        autocomplete="off"
      />
      <div class="suggestions" style=${this.ctl.dropdown.styleMap}>
        <div ?hidden=${!this.fetchError} class="error">Error fetching suggestions</div>
        <div ?hidden=${this.fetchError || !this.suggestions.length} class="suggestion-list">
          <div>
            ${this.suggestions.map(suggestion => html`
              <button
                type="button"
                class="suggestion-item"
                @click=${()=> this._onSuggestionClick(suggestion)}>
                <div class="suggestion-label">${suggestion.label}</div>
                <div class="suggestion-name">${suggestion.name}</div>
              </button>
            `)}
          </div>
          <div ?hidden=${this.totalSuggestions <= this.suggestionLimit} class="more-suggestions">${this.totalSuggestions - this.suggestionLimit} more suggestions available. Please refine your search.</div>
        </div>
        <div ?hidden=${this.fetchError || this.suggestions.length} class="no-suggestions">No suggestions found</div>
      </div>
    </div>
  `;
}