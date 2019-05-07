function debug(...parts) {
  console.log(...parts);
} 

// ------ utils ------

function template(...parts) {
  const template = document.createElement('template');
  template.innerHTML = parts.join('');
  return template;
}

function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}

const genId = (() => {
  let idSeq = 0;
  
  return () => {
    idSeq += 1;
    return 'pg-internal-' + idSeq;
  };
})();

// ------ viewport ------

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
    '<g class="underlay"></g>',
    '<g class="content-container">',
    '  <clipPath><rect></rect></clipPath>',
    '  <g class="content"></g>',
    '</g>',
    '<g class="overlay"></g>',
  
    '<g class="left panel"></g>',
    '<g class="right panel"></g>',
    '<g class="top panel"></g>',
    '<g class="bottom panel"></g>',
  '</svg>'
);

class Viewport extends HTMLElement {
  constructor() {
    super();
  }
  
  connectedCallback() {
    console.log(viewportTemplate.content);
    
    this._svg = document.importNode(viewportTemplate.content, true).firstElementChild;
    
    const contentContainer = this._svg.querySelector('.content-container');
    const clipPathId = genId();
    contentContainer.querySelector('clipPath').id = clipPathId;
    contentContainer.querySelector('.content').setAttribute('clip-path', `url(#${clipPathId})`);
    
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

    const underlay = this._svg.querySelector('.underlay');
    underlay.setAttribute('transform', translate(padding.left, padding.top));
    
    const content = this._svg.querySelector('.content-container');
    content.setAttribute('transform', translate(padding.left, padding.top));
    
    const clippingRect = content.querySelector('clipPath rect');
    clippingRect.setAttribute('width', contentDims.width);
    clippingRect.setAttribute('height', contentDims.height);
    
    const overlay = this._svg.querySelector('.overlay');
    overlay.setAttribute('transform', translate(padding.left, padding.top));
    
    const topPanel = this._svg.querySelector('.top.panel');
    topPanel.setAttribute('transform', translate(padding.left, 0));
    
    const rightPanel = this._svg.querySelector('.right.panel');
    rightPanel.setAttribute('transform', translate(svgBounds.width - padding.right, padding.top));

    const bottomPanel = this._svg.querySelector('.bottom.panel');
    bottomPanel.setAttribute('transform', translate(padding.left, svgBounds.height - padding.bottom));
    
    const leftPanel = this._svg.querySelector('.left.panel');
    leftPanel.setAttribute('transform', translate(0, padding.top));
  }
};

export function defineElements() {
  window.customElements.define('polygraph-viewport', Viewport);
};
