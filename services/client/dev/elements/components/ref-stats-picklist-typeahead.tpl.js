import { html, css } from 'lit';

export function styles() {
  const elementStyles = css`
    ref-stats-picklist-typeahead {
      display: block;
    }

    ref-stats-picklist-typeahead .suggestion-item {
      all: unset;
      display: block;
      width: 100%;
      padding: .25rem .5rem;
      cursor: pointer;
      border-bottom: 1px solid var(--ucd-blue-60, #B0D0ED);
      box-sizing: border-box;
    }
    ref-stats-picklist-typeahead .suggestion-item:hover, .suggestion-item:focus {
      background-color: var(--ucd-gold-30, #FFF9E6);
      color: inherit;
    }
    ref-stats-picklist-typeahead .more-suggestions {
      font-size: .875rem;
      color: var(--ucd-black-60, #666);
      padding: .5rem;
    }
    ref-stats-picklist-typeahead .error {
      color: var(--double-decker, #c10230);
      padding: .5rem;
      font-weight: bold;
    }
    ref-stats-picklist-typeahead .no-suggestions {
      padding: .5rem;
      color: var(--ucd-black-60, #666);
    }
    ref-stats-picklist-typeahead .suggestions {
      border: 1px solid var(--ucd-black-30);
      overflow-y: auto;
      background-color: var(--ucd-white, #fff);
      box-sizing: border-box;
    }
    ref-stats-picklist-typeahead .typeahead-container {
      position: relative;
      width: 100%;
    }
    ref-stats-picklist-typeahead .typeahead-container input {
      width: 100%;
    }
    ref-stats-picklist-typeahead .suggestion-name {
      font-size: .875rem;
      color: var(--ucd-black-60, #666);
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
        placeholder="Start typing to search picklists..."
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