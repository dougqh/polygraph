class Viewport extends HTMLElement {
  constructor() {
    super();
  }
  
  connectedCallback() {
    this._svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.appendChild(this._svg);
    
    this.updateDimensions();
  }
  
  static get observedAttributes() {
    return ['width', 'height'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    this.updateDimensions();
  }
  
  updateDimensions() {
    const style = window.getComputedStyle(this);
    console.log('width', style.width, 'height', style.height);
    
    const width = style.width !== 'auto' ? style.width : this.getAttribute('width');
    const height = style.height !== 'auto' ? style.height : this.getAttribute('height');

    this._svg.style.width = width;
    this._svg.style.height = height;
  }
};

export function defineElements() {
  window.customElements.define('polygraph-viewport', Viewport);
};
