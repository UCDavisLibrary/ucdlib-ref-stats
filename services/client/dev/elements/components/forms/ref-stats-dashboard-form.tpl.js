import { html, css } from 'lit';
import AccessToken from '#lib/AccessToken.js';

export function styles() {
  const elementStyles = css`
    ref-stats-dashboard-form {
      display: block;
      max-width: 600px;
      margin: 0 auto;
    }
    ref-stats-dashboard-form fieldset {
      margin-bottom: 1.5rem;
    }
    ref-stats-dashboard-form .advanced-note {
      font-style: italic;
      margin-bottom: 1rem;
    }
  `;

  return [elementStyles];
}

export function render() {
  const isNew = !this.nameOrId;
  const isEdit = !!this.nameOrId;
  const hasAdminAccess = !!this.AuthModel.token?.hasAdminAccess;
  const rls = this.payload?.superset_rls || {};
  const selectedFormIds = (this.payload?.forms || []).map(f => f.form_id);

  return html`
    <form @submit="${this._onSubmit}" novalidate>

      <cork-field-container schema='dashboard' path='label' class='field-container'>
        <label for=${this.ctl.idGen.get('label')}>Label</label>
        <input
          type="text"
          id=${this.ctl.idGen.get('label')}
          .value=${this.payload?.label || ''}
          required
          @input=${e => this._onPayloadInput('label', e.target.value)}>
      </cork-field-container>

      <cork-field-container schema='dashboard' path='name' class='field-container'>
        <label for=${this.ctl.idGen.get('name')}>Name</label>
        <input
          type="text"
          id=${this.ctl.idGen.get('name')}
          ?disabled=${isEdit}
          .value=${this.payload?.name || ''}
          required
          @input=${e => this._onPayloadInput('name', e.target.value)}>
        <div class='field-description'>
          <div ?hidden=${isEdit}>The name should be unique and URL-friendly: all lowercase with only letters, numbers, and hyphens.</div>
          <div ?hidden=${isEdit}><b>Once saved, the name cannot be changed.</b></div>
          <div ?hidden=${isNew}>The name cannot be changed.</div>
        </div>
      </cork-field-container>

      <cork-field-container schema='dashboard' path='description' class='field-container'>
        <label for=${this.ctl.idGen.get('description')}>Description</label>
        <textarea
          id=${this.ctl.idGen.get('description')}
          .value=${this.payload?.description || ''}
          rows="3"
          @input=${e => this._onPayloadInput('description', e.target.value)}></textarea>
      </cork-field-container>

      <cork-field-container schema='dashboard' path='intro' class='field-container'>
        <label for=${this.ctl.idGen.get('intro')}>Intro</label>
        <textarea
          id=${this.ctl.idGen.get('intro')}
          .value=${this.payload?.intro || ''}
          rows="5"
          @input=${e => this._onPayloadInput('intro', e.target.value)}></textarea>
        <div class='field-description'>Displayed above the embedded dashboard. Supports basic HTML: paragraphs, links, bold, italic, and lists.</div>
      </cork-field-container>

      <cork-field-container schema='dashboard' path='form_ids' class='field-container'>
        <label>Associated Forms</label>
        <p class='field-description u-space-mt--flush'>Link this dashboard to one or more forms. Users can filter dashboards by form on the public listing page.</p>
        <ucd-theme-slim-select
          @change=${e => this._onFormIdsChange(e.detail?.length ? e.detail.map(o => o.value) : [])}>
          <select multiple>
            ${(() => {
              const active = this.allForms.filter(f => !f.is_archived);
              const archived = this.allForms.filter(f => f.is_archived);
              return html`
                ${active.length ? html`
                  <optgroup label="Active">
                    ${active.map(f => html`
                      <option value=${f.form_id} ?selected=${selectedFormIds.includes(f.form_id)}>
                        ${f.label || f.name}
                      </option>
                    `)}
                  </optgroup>
                ` : html``}
                ${archived.length ? html`
                  <optgroup label="Archived">
                    ${archived.map(f => html`
                      <option value=${f.form_id} ?selected=${selectedFormIds.includes(f.form_id)}>
                        ${f.label || f.name}
                      </option>
                    `)}
                  </optgroup>
                ` : html``}
              `;
            })()}
          </select>
        </ucd-theme-slim-select>
      </cork-field-container>

      <cork-field-container schema='dashboard' path='is_archived' class='field-container checkbox'>
        <input
          type="checkbox"
          id=${this.ctl.idGen.get('is_archived')}
          .checked=${this.payload?.is_archived || false}
          @input=${() => this._onPayloadInput('is_archived', !this.payload?.is_archived)}>
        <label for=${this.ctl.idGen.get('is_archived')}>Archived</label>
      </cork-field-container>

      <fieldset>
        <legend>Advanced Configuration</legend>
        <p class='advanced-note' ?hidden=${hasAdminAccess}>These settings are read-only. Contact a Super Admin to make changes.</p>

        <cork-field-container schema='dashboard' path='superset_dashboard_id' class='field-container'>
          <label for=${this.ctl.idGen.get('superset-id')}>Superset Dashboard ID</label>
          <input
            type="text"
            id=${this.ctl.idGen.get('superset-id')}
            ?disabled=${!hasAdminAccess}
            .value=${this.payload?.superset_dashboard_id || ''}
            @input=${e => this._onPayloadInput('superset_dashboard_id', e.target.value)}>
          <div class='field-description'>The UUID of the dashboard in Superset. Found in the "Embed Dashboard" section of the Superset dashboard UI.</div>
        </cork-field-container>

        <cork-field-container schema='dashboard' path='superset_dashboard_ui_config' class='field-container'>
          <label for=${this.ctl.idGen.get('ui-config')}>Dashboard UI Config (JSON)</label>
          <textarea
            id=${this.ctl.idGen.get('ui-config')}
            ?disabled=${!hasAdminAccess}
            .value=${this.payload?._superset_dashboard_ui_config || ''}
            rows="5"
            @input=${e => this._onPayloadInput('_superset_dashboard_ui_config', e.target.value)}></textarea>
          <div class='field-description'>Optional JSON object passed as <code>dashboardUiConfig</code> to the embedded SDK (e.g. <code>{"hideTitle": true}</code>).</div>
        </cork-field-container>

        <fieldset class='basic-legend'>
          <legend>Row-Level Security (RLS)</legend>
          <p>If configured, RLS restricts which data a user can see based on their Keycloak roles.</p>

          <cork-field-container schema='dashboard' path='superset_rls.identifier' class='field-container'>
            <label for=${this.ctl.idGen.get('rls-identifier')}>User Identifier</label>
            <select
              id=${this.ctl.idGen.get('rls-identifier')}
              ?disabled=${!hasAdminAccess}
              .value=${rls.identifier || ''}
              @input=${e => this._onRlsInput('identifier', e.target.value)}>
              <option value="">None</option>
              <option value="username">Username</option>
              <option value="email">Email</option>
            </select>
            <div class='field-description'>The user attribute to use in the RLS SQL clause.</div>
          </cork-field-container>

          <cork-field-container schema='dashboard' path='superset_rls.column' class='field-container'>
            <label for=${this.ctl.idGen.get('rls-column')}>Column</label>
            <input
              type="text"
              id=${this.ctl.idGen.get('rls-column')}
              ?disabled=${!hasAdminAccess}
              .value=${rls.column || ''}
              @input=${e => this._onRlsInput('column', e.target.value)}>
            <div class='field-description'>The dataset column to filter on (e.g. <code>submitted_by</code>).</div>
          </cork-field-container>

          <cork-field-container schema='dashboard' path='superset_rls.departmentHeadColumn' class='field-container'>
            <label for=${this.ctl.idGen.get('rls-department-head-column')}>Allow Department Head to View Employee Submissions</label>
            <input
              type="text"
              id=${this.ctl.idGen.get('rls-department-head-column')}
              ?disabled=${!hasAdminAccess}
              .value=${rls.departmentHeadColumn || ''}
              @input=${e => this._onRlsInput('departmentHeadColumn', e.target.value)}>
            <div class='field-description'>
              The dataset column (or SQL expression) to filter on. If set, and the requesting user is a
              department head, this rule takes over: they see rows where this column matches their
              department or any sub-department, and the User Identifier/Column fields above are ignored
              for them. Users who are not department heads are unaffected by this field and fall back to
              the User Identifier/Column rule above, if configured. This must reference a real column on
              the dataset, not a Superset calculated column &mdash; calculated columns aren't available
              yet at the point RLS is applied. If your group ID is stored inside a JSON column (e.g.
              <code>"group"</code>), use the expression directly, e.g.
              <code>("group"->>'group_id')::numeric</code>.
            </div>
          </cork-field-container>

          <fieldset class='basic-legend'>
            <legend>Apply to Roles</legend>
            <p class='field-description u-space-mt--flush'>If the user has any of these roles, RLS is applied.</p>

            <cork-field-container schema='dashboard' path='superset_rls.applyToRoles' class='field-container checkbox'>
              <input
                type="checkbox"
                id=${this.ctl.idGen.get('rls-apply-to-admin')}
                ?disabled=${!hasAdminAccess}
                .checked=${(rls.applyToRoles || []).includes(AccessToken.ADMIN_ROLE)}
                @input=${e => this._onRlsRoleCheckbox('applyToRoles', 'admin', e.target.checked)}>
              <label for=${this.ctl.idGen.get('rls-apply-to-admin')}>Admin</label>
            </cork-field-container>

            <cork-field-container schema='dashboard' path='superset_rls.applyToRoles' class='field-container checkbox'>
              <input
                type="checkbox"
                id=${this.ctl.idGen.get('rls-apply-to-form-manager')}
                ?disabled=${!hasAdminAccess}
                .checked=${(rls.applyToRoles || []).includes(AccessToken.MANAGER_ROLE)}
                @input=${e => this._onRlsRoleCheckbox('applyToRoles', 'formManager', e.target.checked)}>
              <label for=${this.ctl.idGen.get('rls-apply-to-form-manager')}>Form Manager</label>
            </cork-field-container>

            <cork-field-container schema='dashboard' path='superset_rls.applyToRoles' class='field-container'>
              <label for=${this.ctl.idGen.get('rls-apply-to-other')}>Other Roles</label>
              <input
                type="text"
                id=${this.ctl.idGen.get('rls-apply-to-other')}
                ?disabled=${!hasAdminAccess}
                .value=${this._otherRolesString(rls.applyToRoles)}
                @input=${e => this._onRlsOtherRolesInput('applyToRoles', e.target.value)}>
              <div class='field-description'>Comma-separated Keycloak role names.</div>
            </cork-field-container>
          </fieldset>

          <fieldset class='basic-legend'>
            <legend>Apply if Missing Roles</legend>
            <p class='field-description u-space-mt--flush'>If the user has none of these roles, RLS is applied.</p>

            <cork-field-container schema='dashboard' path='superset_rls.applyIfMissingRoles' class='field-container checkbox'>
              <input
                type="checkbox"
                id=${this.ctl.idGen.get('rls-missing-admin')}
                ?disabled=${!hasAdminAccess}
                .checked=${(rls.applyIfMissingRoles || []).includes(AccessToken.ADMIN_ROLE)}
                @input=${e => this._onRlsRoleCheckbox('applyIfMissingRoles', 'admin', e.target.checked)}>
              <label for=${this.ctl.idGen.get('rls-missing-admin')}>Admin</label>
            </cork-field-container>

            <cork-field-container schema='dashboard' path='superset_rls.applyIfMissingRoles' class='field-container checkbox'>
              <input
                type="checkbox"
                id=${this.ctl.idGen.get('rls-missing-form-manager')}
                ?disabled=${!hasAdminAccess}
                .checked=${(rls.applyIfMissingRoles || []).includes(AccessToken.MANAGER_ROLE)}
                @input=${e => this._onRlsRoleCheckbox('applyIfMissingRoles', 'formManager', e.target.checked)}>
              <label for=${this.ctl.idGen.get('rls-missing-form-manager')}>Form Manager</label>
            </cork-field-container>

            <cork-field-container schema='dashboard' path='superset_rls.applyIfMissingRoles' class='field-container'>
              <label for=${this.ctl.idGen.get('rls-missing-other')}>Other Roles</label>
              <input
                type="text"
                id=${this.ctl.idGen.get('rls-missing-other')}
                ?disabled=${!hasAdminAccess}
                .value=${this._otherRolesString(rls.applyIfMissingRoles)}
                @input=${e => this._onRlsOtherRolesInput('applyIfMissingRoles', e.target.value)}>
              <div class='field-description'>Comma-separated role names.</div>
            </cork-field-container>
          </fieldset>
        </fieldset>
      </fieldset>

      <div>
        <button type="submit" class='btn btn--primary'>${isEdit ? 'Save Changes' : 'Create Dashboard'}</button>
        <button type="button" class='btn btn--invert' @click=${this._onDeleteRequest} ?disabled=${!hasAdminAccess} ?hidden=${isNew}>Delete</button>
      </div>

    </form>
  `;
}
