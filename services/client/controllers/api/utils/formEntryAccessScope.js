import models from '#models';

/**
 * @description Resolves the form-entry access tier for a user, deduplicating the precedence
 * logic shared by the form-entry query/filters/export routes. Precedence: global manager
 * (unrestricted) > a single-form request scoped to a form the user form-manages (unrestricted
 * for that form — form-manager wins over department-head when the request is form-scoped) >
 * department head (scoped to their department + sub-departments, any form) > form-manager
 * (scoped to all forms they manage) > none (caller should fall back to submitted_by = token.id).
 * @param {import('#lib/AccessToken.js').default} token - req.auth.token
 * @param {Object} userData - .res from models.libraryIam.getUserById(token.id); may be null/undefined
 * @param {String[]|null} requestedForms - already-parsed req.payload.form, or null/undefined if unset
 * @returns {Promise<{tier: 'manager'|'form-manager'|'department-head'|'none', forms: String[]|null, groupIds: Number[]|null}>}
 *   forms/groupIds are null when that axis is unrestricted for the resolved tier.
 */
async function resolveFormEntryAccessScope(token, userData, requestedForms) {
  if ( token.hasManagerAccess ) {
    return { tier: 'manager', forms: null, groupIds: null };
  }

  const formManagerForms = token.formManagerForms;
  const isSingleFormRequest = Array.isArray(requestedForms) && requestedForms.length === 1;
  if ( isSingleFormRequest && formManagerForms.includes(requestedForms[0]) ) {
    return { tier: 'form-manager', forms: requestedForms, groupIds: null };
  }

  const headOfGroupIds = (userData?.groups || []).filter(g => g.isHead).map(g => g.id);
  if ( headOfGroupIds.length > 0 ) {
    const groupIds = await models.libraryIam.addChildGroupIds(headOfGroupIds);
    return { tier: 'department-head', forms: null, groupIds };
  }

  if ( formManagerForms.length > 0 ) {
    return { tier: 'form-manager', forms: formManagerForms, groupIds: null };
  }

  return { tier: 'none', forms: null, groupIds: null };
}

export default resolveFormEntryAccessScope;
