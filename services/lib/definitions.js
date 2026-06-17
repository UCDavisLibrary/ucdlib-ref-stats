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
      'instruction-statistics': ['participant-count', 'instructor-session-type', 'department', 'date']
    };
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

  fieldTypeUsesPickList(fieldType) {
    const ft = this.fieldTypes.find(ft => ft.value === fieldType);
    return ft ? !!ft.usesPickList : false;
  }

}

export default new Definitions();