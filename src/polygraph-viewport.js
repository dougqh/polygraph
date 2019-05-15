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
    '<svg xmlns="http://www.w3.org/2000/svg" class="polygraph viewport" style="width: 100%; height: 100%;">',
    /* panels are filled-in via ScrollablePanel */
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

function importScrollbars() {
  return import('./polygraph-scrollbars.js');
}

const clippedTemplate = (() => {
  const svg = [
    '<g class="panel-container" xmlns="http://www.w3.org/2000/svg">',
    '  <g class="scrollable">',
    '    <clipPath><rect></rect></clipPath>',
    '    <g></g>',
    '  </g>',  
    '</g>'
  ];
  
  const template = document.createElement('template');
  template.innerHTML = svg.join('');
  return template;
})();

const unclippedTemplate = (() => {
  const svg = [
    '<g class="panel-container" xmlns="http://www.w3.org/2000/svg">',
    '  <g class="scrollable">',
    '    <g></g>',
    '  </g>',  
    '</g>'
  ];
  
  const template = document.createElement('template');
  template.innerHTML = svg.join('');
  return template;
})();

class ScrollablePanel {
  constructor(opts) {
    const clipped = opts.hasOwnProperty('clipped' ) ? opts.clipped : true;
    
    const template = clipped ? clippedTemplate : unclippedTemplate;
    this._container = document.importNode(template.content, true).firstElementChild;
    
    this._scrollable = this._container.querySelector('.scrollable');
    this._content = this._scrollable.querySelector('g');
    
    if ( clipped ) {
      const clipPathId = genId();
      
      const clipPath = this._scrollable.querySelector('clipPath');
      clipPath.id = clipPathId;
      this._content.setAttribute('clip-path', `url(#${clipPathId})`);
      
      this._clippingRect = clipPath.querySelector('rect');
    }
  }
  
  set position([x, y]) {
    this._container.setAttribute('transform', `translate(${x} ${y})`);
  }  
  
  set dimensions({width, height}) {
    if ( this._clippingRect ) {
      this._clippingRect.setAttribute('width', width);
      this._clippingRect.setAttribute('height', height);
    }
  }
  
  set scroll([xPos, yPos]) {
    this._scrollable.setAttribute('transform', `translate(${xPos} ${yPos})`);
  }
  
  get element() {
    return this._container;
  }
  
  get content() {
    return this._content;
  }
  
  get classList() {
    return this._content.classList;
  }
  
  get style() {
    return this._content.style;
  }
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
    
    // TODO: Put the panels into a document fragment first???
    this._underlay = new ScrollablePanel({clipped: false});
    this._underlay.classList.add('underlay');
    this._svg.append(this._underlay.element);
    
    this._content = new ScrollablePanel({clipped: true});
    this._content.classList.add('content');
    this._svg.append(this._content.element);
    
    this._top = new ScrollablePanel({clipped: true});
    this._top.classList.add('top', 'panel');
    this._svg.append(this._top.element);
    
    this._right = new ScrollablePanel({clipped: true});
    this._right.classList.add('right', 'panel');
    this._svg.append(this._right.element);
    
    this._bottom = new ScrollablePanel({clipped: true});
    this._bottom.classList.add('bottom', 'panel');
    this._svg.append(this._bottom.element);
    
    this._left = new ScrollablePanel({clipped: true});
    this._left.classList.add('left', 'panel');
    this._svg.append(this._left.element);
    
    this._overlay = new ScrollablePanel({clipped: false});
    this._overlay.classList.add('overlay');
    this._svg.append(this._overlay.element);
    
    
    this._contentDims = {width: 0, height: 0};
    
    this._innerMargins = Viewport.DEFAULT_INNER_MARGINS;
    this._priorBounds = { width: -1, height: -1 };
    
    // stand-ins until scrollbar module is loaded
    this._horizScrollbar = {};
    this._vertScrollbar = {};
    this._attachedScrollbars = false;
    
    importScrollbars().then((scrollbarsModule) => this._attachScrollbars(scrollbarsModule));
  }
  
  get underlay() {
    return this._underlay.content;
  }
  
  get content() {
    return this._content.content;
  }
  
  get overlay() {
    return this._overlay.content;
  }
  
  get top() {
    return this._top.content;
  }
  
  get right() {
    return this._right.content;
  }
  
  get bottom() {
    return this._bottom.content;
  }
  
  get left() {
    return this._left.content;
  }
  
  updateStyle(style) {
    // DQH: if-s are likely overkill / pointless
    if ( style.width ) this.visibleWidth = style.width;
    if ( style.height ) this.visibleHeight = style.height;
    
    if ( style.border ) this.border = style.border;
    if ( style.margin ) this.margin = style.margin;
    if ( style.padding ) this.padding = style.padding;
    
    if ( style.overflowX ) this.overflowX = style.overflowX;
    if ( style.overflowY ) this.overflowY = style.overflowY;
  }
  
  set visibleDimensions({width, height}) {
    this.visibleWidth = width;
    this.visibleHeight = height;
  }
  
  set visibleWidth(width) {
    this._div.style.width = width;
    
    this.refresh();
  }
  
  set visibleHeight(height) {
    this._div.style.height = height;
    
    this.refresh();
  }
  
  get visibleWidth() {
    return thhs._div.style.width;
  }
  
  get visibleHeight() {
    return this._div.style.height;
  }
  
  set contentDimensions({width, height}) {
    this._contentDims.width = width;
    this._contentDims.height = height;
    
    this._updateScrollbars();
  }
  
  set contentWidth(width) {
    this._contentDims.width = width;
    
    this.refresh();
  }
  
  set contentHeight(height) {
    this._contentDims.height = height;
    
    this.refresh();
  }
  
  set innerMargins(marginObj) {
    const defaults = Viewport.DEFAULT_INNER_MARGINS;
    
    this._innerMargins = {
      top: marginObj.top || defaults.top,
      right: marginObj.right || defaults.right,
      bottom: marginObj.bottom || defaults.bottom,
      left: marginObj.left || defaults.left
    };
    
    this.refresh();
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
  
  set overflowX(overflow) {
    this._horizScrollbar.overflow = overflow;
  }
  
  get overflowX() {
    return this._horizScrollbar.overflow;
  }
  
  set overflowY(overflow) {
    this._vertScrollbar.overflow = overflow;
  }
  
  get overflowY() {
    return this._vertScrollbar.overflow;
  }
  
  get element() {
    return this._div;
  }
  
  render() {
    this.refresh();
    
    return this.element; 
  }
  
  resizeHandler() {
    const svgBounds = this._svg.getBoundingClientRect();
    // debug('bounds', svgBounds);
    
    const unchanged = 
      ( this._priorBounds.width === svgBounds.width ) &&
      ( this._priorBounds.height === svgBounds.height );
      
    if ( !unchanged ) this.refresh();
  }
  
  refresh() {    
    if ( !this._refreshPending ) {
      window.setTimeout(() => this._refresh(), 0);

      this._refreshPending = true; 
    }
  }
  
  _refresh() {  
    const svgBounds = this._svg.getBoundingClientRect();
    
    const marginPxs = calcInnerMarginPixels(this._innerMargins, svgBounds);
        
    const visibleContentDims = {
      width: svgBounds.width - marginPxs.left - marginPxs.right,
      height: svgBounds.height - marginPxs.top - marginPxs.bottom
    };
    
    // TODO: Add some padding for scrollbars???

    this._horizScrollbar.visibleSize = visibleContentDims.width;
    this._horizScrollbar.contentSize = this._contentDims.width;
    
    this._vertScrollbar.visibleSize = visibleContentDims.height;
    this._vertScrollbar.contentSize = this._contentDims.height;
    
    this._underlay.position = [marginPxs.left, marginPxs.top];
    this._underlay.dimensions = visibleContentDims;  // not clipped
    
    this._content.position = [marginPxs.left, marginPxs.top];
    this._content.dimensions = visibleContentDims;
    
    this._overlay.position = [marginPxs.left, marginPxs.top + visibleContentDims.height];
    this._overlay.dimensions = visibleContentDims;  // not clipped
    
    this._top.position = [marginPxs.left, 0];
    this._top.dimensions = {width: visibleContentDims.width, height: marginPxs.top};
    
    this._right.position = [marginPxs.left + visibleContentDims.width, marginPxs.top];
    this._right.dimensions = {width: marginPxs.right, height: visibleContentDims.height};
    
    this._bottom.position = [marginPxs.left, marginPxs.top + visibleContentDims.height];
    this._bottom.dimensions = {width: visibleContentDims.width, height: marginPxs.bottom};
    
    this._left.position = [0, marginPxs.top];
    this._left.dimensions = {width: marginPxs.left, height: visibleContentDims.height};
    
    if ( this._attachedScrollbars ) {
      this._horizScrollbar.element.style.top = (marginPxs.top + visibleContentDims.height) + 'px';
      this._horizScrollbar.element.style.left = marginPxs.left + 'px';
    
      this._vertScrollbar.element.style.top = marginPxs.top + 'px';
      this._vertScrollbar.element.style.left = (marginPxs.left + visibleContentDims.width) + 'px';
    }

    this._priorBounds = svgBounds;
    this._refreshPending = false;
  }
  
  _attachScrollbars(scrollbarsModule) {
    const svgBounds = this._svg.getBoundingClientRect();
    
    console.log('attaching scrollbars');
    
    // pass along accumulated values from the stand-in object
    this._horizScrollbar = new scrollbarsModule.HorizontalScrollbar(this._horizScrollbar);
    this._div.append(this._horizScrollbar.element);
    
    this._horizScrollbar.element.style.position = 'absolute';
    
    // pass along accumulated values from the stand-in object
    this._vertScrollbar = new scrollbarsModule.VerticalScrollbar(this._vertScrollbar);
    this._div.append(this._vertScrollbar.element);
    
    this._vertScrollbar.element.style.position = 'absolute';
    
    this._horizScrollbar.addListener(() => this._horizScrollHandler());
    this._vertScrollbar.addListener(() => this._vertScrollHandler());
    
    // attaching is done -- refresh to place properly
    this._attachedScrollbars = true;
    this._refresh();
  }
  
  _horizScrollHandler() {
    const xPos = this._horizScrollbar.position;
    const yPos = this._vertScrollbar.position;
    
    this._underlay.scroll = [xPos, yPos];
    this._content.scroll = [xPos, yPos];
    this._overlay.scroll = [xPos, yPos];
    
    this._top.scroll = [xPos, 0];
    this._bottom.scroll = [xPos, 0];
  }
  
  _vertScrollHandler() {
    const xPos = this._horizScrollbar.position;
    const yPos = this._vertScrollbar.position;
    
    this._underlay.scroll = [xPos, yPos];
    this._content.scroll = [xPos, yPos];
    this._overlay.scroll = [xPos, yPos];
    
    this._right.scroll = [0, yPos];
    this._left.scroll = [0, yPos];
  }
}