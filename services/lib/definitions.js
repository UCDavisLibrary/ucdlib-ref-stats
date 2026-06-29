/**
 * @description Definitions class provides a centralized place to define and manage various constants and configurations used throughout the application, such as field types, custom validation rules, and form edit interval units.
 * It also includes methods to validate and retrieve these definitions, ensuring consistency and maintainability across the codebase.
 * @property {Array} fieldTypes - An array of objects representing the different field types available in forms, each with a value and label, and an optional usesPickList property indicating if the field type requires a pick list.
 * @property {Object} customValidationRegistry - An object that maps form names to arrays of field names that have custom validation rules defined in the code.
 * @property {Array} formEditIntervalUnits - An array of objects representing the different units of time that can be used to define edit intervals for forms, each with a value and label.
 */
class Definitions {

  constructor() {
    this.fieldTypes = [
      { value: 'text', label: 'Text' },
      { value: 'textarea', label: 'Textarea' },
      { value: 'number', label: 'Number' },
      { value: 'date', label: 'Date' },
      { value: 'datetime', label: 'Date & Time' },
      { value: 'select', label: 'Select', usesPickList: true },
      { value: 'checkbox-multiple', label: 'Checkbox', usesPickList: true },
      { value: 'checkbox-single', label: 'Checkbox (Single)' },
      { value: 'radio', label: 'Radio', usesPickList: true },
      { value: 'typeahead', label: 'Typeahead', usesPickList: true }
    ];

    this.customValidationRegistry = {
      // Example: register field names here for any form that needs a fully custom schema.
      // Fields listed here can then be used with definitions.customValidation(fieldName, formName)
      // in services/client/controllers/api/utils/validation/schemas/form-entry.js.
      'example': ['example-field']
    };

    this.formEditIntervalUnits = [
      { value: 'minutes', label: 'Minutes' },
      { value: 'hours', label: 'Hours' },
      { value: 'days', label: 'Days' },
      { value: 'weeks', label: 'Weeks' },
      { value: 'months', label: 'Months' },
      { value: 'years', label: 'Years' },
      { value: 'never', label: 'Never Allow Edits', hideAmount: true },
      { value: 'always', label: 'Always Allow Edits', hideAmount: true }
    ];
  }

  /**
   * @description Validates that fieldName is registered in customValidationRegistry for formName,
   * then returns fieldName for use as a computed Zod object key.
   * Throws if the field is not registered — forcing developers to update the registry first.
   * @param {string} fieldName
   * @param {string} formName
   * @returns {string} fieldName
   */
  customValidation(fieldName, formName) {
    if ( !this.customValidationRegistry[formName]?.includes(fieldName) ) {
      throw new Error(`customValidation: "${fieldName}" is not registered for form "${formName}" in definitions.customValidationRegistry`);
    }
    return fieldName;
  }

  /**
   * @description Returns true if the field has a hardcoded code-level validator for the given form.
   * @param {string} formName
   * @param {string} fieldName
   * @returns {boolean}
   */
  hasCustomValidation(formName, fieldName) {
    return !!(this.customValidationRegistry[formName]?.includes(fieldName));
  }

  /**
   * @description Returns true if the given field type requires a pick list
   * @param {string} fieldType - A field type value (e.g. 'select', 'radio')
   * @returns {boolean}
   */
  fieldTypeUsesPickList(fieldType) {
    const ft = this.fieldTypes.find(ft => ft.value === fieldType);
    return ft ? !!ft.usesPickList : false;
  }

}

export default new Definitions();