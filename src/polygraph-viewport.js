function debug(...parts) {
  console.log(...parts);
} 

// ------ utils ------

function translate(x, y) {
  return 'translate(' + x + ',' + y + ')';
}

const genId = (() => {
  let idSeq = 0;
  
  return () => {
    idSeq += 1;
    return 'pg-viewport-internal-' + idSeq;
  };
})();

// ----- viewport  ----

const viewportTemplate = (() => {
  const html = [
    '<div>',
    '<svg xmlns="http://www.w3.org/2000/svg" class="polygraph-viewport" style="width: 100%; height: 100%;">',
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
    '</svg>',
    '</div>'
  ];
  
  const template = document.createElement('template');
  template.innerHTML = html.join('');
  return template;
})();

function calcInnerMarginPixels(marginObj, bounds) {
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
    top: calcPixels(marginObj.top, bounds.height),
    right: calcPixels(marginObj.right, bounds.width),
    bottom: calcPixels(marginObj.bottom, bounds.height),
    left: calcPixels(marginObj.left, bounds.width)
  };
}

export class Viewport {
  static get DEFAULT_INNER_MARGINS() {
    return {
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px'
    };
  }
  
  constructor() {
    this._div = document.importNode(viewportTemplate.content, true).firstElementChild;
    this._svg = this._div.querySelector('svg');
    
    const contentContainer = this._svg.querySelector('.content-container');
    const clipPathId = genId();
    contentContainer.querySelector('clipPath').id = clipPathId;
    contentContainer.querySelector('.content').setAttribute('clip-path', `url(#${clipPathId})`);
    
    this._innerMargins = Viewport.DEFAULT_INNER_MARGINS;
    this._priorBounds = { width: -1, height: -1 };
  }
  
  updateStyle(style) {
    // DQH: if-s are likely overkill / pointless
    if ( style.width ) this.width = style.width;
    if ( style.height ) this.height = style.height;
    
    if ( style.border ) this.border = style.border;
    if ( style.margin ) this.margin = style.margin;
    if ( style.padding ) this.padding = style.padding;
  }
  
  set dims(dimsObj) {
    if ( typeof dimsObj.width !== 'undefined' ) this.width = dimsObj.width;
    if ( typeof dimsObj.height !== 'undefined' ) this.heigh = dimsObj.height;
  }
  
  set width(width) {
    this._div.style.width = width;
    
    this.resizePanels();
  }
  
  set height(height) {
    this._div.style.height = height;
    
    this.resizePanels();
  }
  
  get width() {
    return thhs._div.style.width;
  }
  
  get height() {
    return this._div.style.height;
  }
  
  set innerMargins(marginObj) {
    const defaults = DEFAULT_MARGINS();
    
    this._innerMargins = {
      top: marginObj.top || defaults.top,
      right: marginObj.right || defaults.right,
      bottom: marginObj.bottom || defaults.bottom,
      left: marginObj.left || defaults.left
    };
    
    this.resizePanels();
  }
  
  get innerMargins() {
    return this._innerMargins;
  }
  
  set border(border) {
    this._div.style.border = border;
  }
  
  get border() {
    this._div.style.border;
  }
  
  set margin(margin) {
    this._div.style.margin = margin;
  }
  
  get margin() {
    return this._div.style.margin;
  }
  
  set padding(padding) {
    this._div.style.padding = padding;
  }
  
  get padding() {
    return this._div.style.padding;
  }
  
  set display(display) {
    return this._div.display = display;
  }
  
  get display() {
    return this._div.display;
  }
  
  get element() {
    return this._div;
  }
  
  render() {
    this.resizePanels();
    
    return this.element; 
  }
  
  resizeHandler() {
    const svgBounds = this._svg.getBoundingClientRect();
    // debug('bounds', svgBounds);
    
    const unchanged = 
      ( this._priorBounds.width === svgBounds.width ) &&
      ( this._priorBounds.height === svgBounds.height );
      
    if ( !unchanged ) this.resizePanels();
  }
  
  resizePanels() {    
    if ( !this._resizePending ) {
      window.setTimeout(() => this._resizePanels(), 0);

      this._resizePending = true; 
    }
  }
  
  _resizePanels() {  
    const svgBounds = this._svg.getBoundingClientRect();
    
    const marginPxs = calcInnerMarginPixels(this._innerMargins, svgBounds);
    // debug('computed padding', padding);
        
    const contentDims = {
      width: svgBounds.width - marginPxs.left - marginPxs.right,
      height: svgBounds.height - marginPxs.top - marginPxs.bottom
    };

    const underlay = this._svg.querySelector('.underlay');
    underlay.setAttribute('transform', translate(marginPxs.left, marginPxs.top));
    
    const content = this._svg.querySelector('.content-container');
    content.setAttribute('transform', translate(marginPxs.left, marginPxs.top));
    
    const clippingRect = content.querySelector('clipPath rect');
    clippingRect.setAttribute('width', contentDims.width);
    clippingRect.setAttribute('height', contentDims.height);
    
    const overlay = this._svg.querySelector('.overlay');
    overlay.setAttribute('transform', translate(marginPxs.left, marginPxs.top));
    
    const topPanel = this._svg.querySelector('.top.panel');
    topPanel.setAttribute('transform', translate(marginPxs.left, 0));
    
    const rightPanel = this._svg.querySelector('.right.panel');
    rightPanel.setAttribute('transform', translate(svgBounds.width - marginPxs.right, marginPxs.top));

    const bottomPanel = this._svg.querySelector('.bottom.panel');
    bottomPanel.setAttribute('transform', translate(marginPxs.left, svgBounds.height - marginPxs.bottom));
    
    const leftPanel = this._svg.querySelector('.left.panel');
    leftPanel.setAttribute('transform', translate(0, marginPxs.top));
    
    this._resizePending = false;
    this._priorBounds = svgBounds;
  }
}