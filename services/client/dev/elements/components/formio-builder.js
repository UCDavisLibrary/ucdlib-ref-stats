import { LitElement } from 'lit';
import {render, styles} from "./formio-builder.tpl.js";

//import { Formio } from '@formio/js/sdk';
import '@formio/js/dist/formio.full.min.js';

import { LitCorkUtils, Mixin } from '@ucd-lib/cork-app-utils';
import { MainDomElement } from "@ucd-lib/theme-elements/utils/mixins/main-dom-element.js";

// export default class FormioBuilder extends Mixin(LitElement)
//   .with( MainDomElement) {

export default class FormioBuilder extends LitElement {

  static get properties() {
    return {
      form: {type: Object},
      options: {type: Object},
      builder: {type: Object}
    }
  }

  static get styles() {
    return styles();
  }

  constructor() {
    super();
    this.render = render.bind(this);
    this.form = null;
    this.options = null;
    this.builder = null;
  }

  firstUpdated(){
    this.domReady = true;
    this.initBuilder();
  }
  
  willUpdate(props) {
    if ( this.domReady && (props.has('form') || props.has('options')) ) {
      this.initBuilder();
    }
  }

  async initBuilder(){
    if ( this.builder ){
      this.renderRoot.querySelector('#builder').innerHTML = '';
    }
    // SDK method 
    // this.builder = new Formio.FormBuilder(
    //   this.renderRoot.querySelector('#builder'),
    //   this.form || {},
    //   this.options || {}
    // );

    // Legacy method
    this.builder = await window.Formio.builder(
      this.renderRoot.querySelector('#builder'),
      this.form || {},
      this.options || {}
    );
  }

}

customElements.define('formio-builder', FormioBuilder);