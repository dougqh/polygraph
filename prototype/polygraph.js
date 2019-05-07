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
    
    this.style.display = 'none';
    
    this._priorBounds = { width: -1, height: -1 };
    
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
      
      return expr;
    }

    this._svg.style.width = calcSum(style.width, style.paddingLeft, style.paddingRight);
    this._svg.style.height = calcSum(style.height, style.paddingTop, style.paddingBottom);
    
    this._svg.style.margin = style.margin;
    this._svg.style.border = style.border;

    // DQH: 2019 May - Tried ResizeObserver to no avail, since it isn't widely support 
    // decided to listen to window instead.  To avoid too many DOM updates, resizePanels 
    // checks if the bounding rect has changed.
    this.resizePanels();
    window.addEventListener('resize', () => this.resizePanels());
  }
  
  resizePanels() {
    const style = this.computedStyle; 
    // debug('padding', style.padding);
    
    const svgBounds = this._svg.getBoundingClientRect();
    // debug('bounds', svgBounds);
    
    const unchanged = 
      ( this._priorBounds.width === svgBounds.width ) &&
      ( this._priorBounds.height === svgBounds.height );
      
    if ( unchanged ) {
      // debug('unchanged', this._priorBounds, svgBounds);
      return;
    }
    this._priorBounds = svgBounds;

    
    const padding = computePadding(style, svgBounds);
    // debug('computed padding', padding);
        
    const contentDims = {
      width: svgBounds.width - padding.left - padding.right,
      height: svgBounds.height - padding.top - padding.bottom
    };
    
    { // top
      const topTransform = translate(padding.left, 0);
      
      const topMask = this._svg.querySelector('.top.mask');
      topMask.setAttribute('transform', topTransform);
      topMask.setAttribute('width', contentDims.width);
      topMask.setAttribute('height', padding.top);
            
      const topPanel = this._svg.querySelector('.top.panel');
      topPanel.setAttribute('transform', topTransform);
    }
    
    { // right
      const rightTransform = translate(svgBounds.width - padding.right, padding.top);
      
      const rightMask = this._svg.querySelector('.right.mask');
      rightMask.setAttribute('transform', rightTransform);
      rightMask.setAttribute('width', padding.right);
      rightMask.setAttribute('height', contentDims.height);
      
      const rightPanel = this._svg.querySelector('.right.panel');
      rightPanel.setAttribute('transform', rightTransform);
    }
    
    { // bottom
      const bottomTransform = translate(padding.left, svgBounds.height - padding.bottom);
      
      const bottomMask = this._svg.querySelector('.bottom.mask');
      bottomMask.setAttribute('transform', bottomTransform);
      bottomMask.setAttribute('width', contentDims.width);
      bottomMask.setAttribute('height', padding.bottom);
      
      const bottomPanel = this._svg.querySelector('.bottom.panel');
      bottomPanel.setAttribute('transform', bottomTransform);
    }
    
    { // left
      const leftTransform = translate(0, padding.top);
    
      const leftMask = this._svg.querySelector('.left.mask');
      leftMask.setAttribute('transform', leftTransform);
      leftMask.setAttribute('width', padding.left);
      leftMask.setAttribute('height', contentDims.height);
          
      const leftPanel = this._svg.querySelector('.left.panel');
      leftPanel.setAttribute('transform', leftTransform);
    }
    
    { // content
      const content = this._svg.querySelector('.content');
      content.setAttribute('transform', translate(padding.left, padding.top));
    }
    
    { // overlay
      const overlay = this._svg.querySelector('.overlay');
      overlay.setAttribute('transform', translate(padding.left, padding.top));
    }
  }
};

export function defineElements() {
  window.customElements.define('polygraph-viewport', Viewport);
};
