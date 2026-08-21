import { html } from 'lit';
import { Registry } from '@ucd-lib/cork-app-utils';

export default (dashboard) => {
  if ( !dashboard?.name ) return html``;
  const isManager = Registry?.models?.AuthModel?.token?.hasManagerAccess || false;

  return html`
    <div class="dashboard-teaser">
      <div class="dashboard-teaser__content">
        <div class="dashboard-teaser__badges" ?hidden=${!dashboard.forms?.length}>
          ${dashboard.forms.filter(form => !form.is_archived).map(form => html`
            <div class="badge badge--form">${form.label}</div>
          `)}
        </div>
        <div><a class='dashboard-teaser__title' href='/analytics/${dashboard.name}'>${dashboard.label}</a></div>
        <div class='dashboard-teaser__description'>${dashboard.description}</div>
      </div>
      <div class='dashboard-teaser__actions'>
        <cork-icon-button 
          icon='fas.gear' 
          title='Edit Dashboard'
          link-aria-label='Edit Dashboard'
          href='/analytics-admin/${dashboard.name}' ?hidden=${!isManager}></cork-icon-button>
      </div>
    </div>
  `

}