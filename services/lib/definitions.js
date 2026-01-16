class Definitions {

  constructor() {
    this.fieldTypes = [
      { value: 'text', label: 'Text' },
      { value: 'textarea', label: 'Textarea' },
      { value: 'number', label: 'Number' },
      { value: 'date', label: 'Date' },
      { value: 'select', label: 'Select', usesPickList: true },
      { value: 'checkbox-multiple', label: 'Checkbox', usesPickList: true },
      { value: 'checkbox-single', label: 'Checkbox (Single)' },
      { value: 'radio', label: 'Radio', usesPickList: true },
      { value: 'typeahead', label: 'Typeahead', usesPickList: true }
    ];
  }

  fieldTypeUsesPickList(fieldType) {
    const ft = this.fieldTypes.find(ft => ft.value === fieldType);
    return ft ? !!ft.usesPickList : false;
  }

}

export default new Definitions();