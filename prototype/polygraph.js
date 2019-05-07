function debug(...parts) {
  console.log(...parts);
}

function template(...parts) {
  const template = document.createElement('template');
  template.innerHTML = parts.join('');
  return template;
}

function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}

function computePadding(style, bounds) {
  function calcPixels(sizeSpec, pixels) {
    const num = Number.parseFloat(sizeSpec, 10);
    if ( num === 0 ) return 0;
    
    if ( sizeSpec.endsWith('px') ) {
      return num;
    } else if ( sizeSpec.endsWith('%') ) {
      return pixels / 100 * num;
    } else {
      throw new Error('Unsupported size spec: ' + sizeSpec);
    }
  }
  
  return {
    top: calcPixels(style.paddingTop, bounds.height),
    right: calcPixels(style.paddingRight, bounds.width),
    bottom: calcPixels(style.paddingBottom, bounds.height),
    left: calcPixels(style.paddingLeft, bounds.width)
  };
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
    
    this._display = this.style.display;
    this.style.display = 'none';
    
    this.updateDimensions();
  }
  
  static get observedAttributes() {
    return ['style', 'class'];
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
    
    function calcSum(base, add1, add2) {
      if ( base === 'auto' ) return 'auto';
      
      debug('calcSum ', base, add1, add2);
      
      let expr = `calc(${base}`;
      if ( add1.endsWith('%') ) {
        const prop1 = Number.parseFloat(add1, 10) / 100;
        expr += ` + ${base} * ${prop1}`;
      } else {
        expr += ` + ${add1}`;
      }
      
      if ( add2.endsWith('%') ) {
        const prop2 = Number.parseFloat(add2, 10) / 100;
        expr += ` + ${base} * ${prop2}`;
      } else {
        expr += ` + ${add2}`;
      }
      expr += ')';
      
      debug('expr', expr);
      return expr;
    }

    // TODO: DQH
    // current means of calculating is slightly incorrect, since width is percentage of parent element 
    // and padding is percentage of this element
    this._svg.style.width = calcSum(style.width, style.paddingLeft, style.paddingRight);
    this._svg.style.height = calcSum(style.height, style.paddingTop, style.paddingBottom);
    
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
    
    const padding = computePadding(style, svgBounds);
    debug('computed padding', padding);
    
    this._svg.querySelectorAll('.left').forEach((leftEl) => {
      leftEl.setAttribute('transform', translate(0, padding.top));
    });

    this._svg.querySelectorAll('.top').forEach((topEl) => {
      topEl.setAttribute('transform', translate(padding.left, 0));
    });

    this._svg.querySelectorAll('.right').forEach((rightEl) => {
      rightEl.setAttribute('transform', translate(svgBounds.width - padding.right, 0), padding.top);
    });
    
    this._svg.querySelectorAll('.bottom').forEach((bottomEl) => {
      bottomEl.setAttribute('transform', translate(padding.left, svgBounds.height - padding.bottom));
    });
  }
};

export function defineElements() {
  window.customElements.define('polygraph-viewport', Viewport);
};
