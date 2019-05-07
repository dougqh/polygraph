function debug(...parts) {
  console.log(...parts);
}

function template(...parts) {
  const template = document.createElement('template');
  template.innerHTML = parts.join('');
  return template;
}

const viewportTemplate = template(
  '<svg class="polygraph-viewport" xmlns="http://www.w3.org/2000/svg">',
    '<g class="content"></g>',
          
    '<rect class="left mask"></rect>',
    '<rect class="right mask"></rect>',
    '<rect class="top mask"></rect>',
    '<rect class="bottom mask"></rect>',
          
    '<g class="left panel"></g>',
    '<g class="right panel"></g>',
    '<g class="top panel"></g>',
    '<g class="bottom panel"></g>',
  
    '<g class="overlay"></g>',
  '</svg>'
);

class Viewport extends HTMLElement {
  constructor() {
    super();
  }
  
  connectedCallback() {
    console.log(viewportTemplate.content);
    
    this._svg = document.importNode(viewportTemplate.content, true).firstElementChild;
    
    this.appendChild(this._svg);
    this.after(this._svg);
    this.style.display = 'none';
    
    this.updateDimensions();
  }
  
  static get observedAttributes() {
    return ['width', 'height'];
  }
  
  attributeChangedCallback(name, oldValue, newValue) {
    this.updateDimensions();
  }
  
  get computedStyle() {
    return window.getComputedStyle(this);
  }
  
  updateDimensions() {
    // DQH: This is defense against races in the initialization process.
    // This works for now, but probably warrants a cleaner more deliberate appoach later.
    // I'm just not sure what this is yet.
    if ( !this._svg ) return;
    
    const style = this.computedStyle;
    if ( !style ) return;
    
    debug('viewport dims: ', [style.width, style.height]);
        
    const width = style.width !== 'auto' ? style.width : this.getAttribute('width');
    const height = style.height !== 'auto' ? style.height : this.getAttribute('height');

    this._svg.style.width = width;
    this._svg.style.height = height;
    
    this._svg.style.margin = style.margin;
    this._svg.style.border = style.border;
        
    if ( !this._resizeObserver ) {
      this._resizeObserver = new ResizeObserver(() => this.resizePanels());
      this._resizeObserver.observe(this._svg);
      
      this.resizePanels();
    }
  }
  
  resizePanels() {
    const style = this.computedStyle; 
    debug('padding', style.padding);
    
    const svgBounds = this._svg.getBoundingClientRect();
    debug('bounds', svgBounds);
  }
};

export function defineElements() {
  window.customElements.define('polygraph-viewport', Viewport);
};
