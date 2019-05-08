const scrollbarTemplate = (() => {
  const html = [
    '<div class="polygraph scrollbar">',
    '  <div class="content-proxy">&nbsp;</div>',
    '</div>'
  ];
  
  const template = document.createElement('template');
  template.innerHTML = html.join('');
  return template;
})();

export class HorizontalScrollbar {
  constructor(opts) {
    this._scrollbarDiv = document.importNode(scrollbarTemplate.content, true).firstElementChild;
    this._scrollbarDiv.style.width = '0px';
    
    this._contentProxyDiv = this._scrollbarDiv.querySelector('.content-proxy');
    this._contentProxyDiv.style.width = '0px';
    this._contentProxyDiv.style.height = '1px';
    
    if ( opts.contentSize ) this.contentSize = opts.contentSize;
    if ( opts.visibleSize ) this.visibleSize = opts.visibleSize;
    if ( opts.overflow ) this.overflow = opts.overflow;
  }
  
  set contentSize(value) {
    this._contentProxyDiv.style.width = value + 'px';
  }
  
  set visibleSize(value) {
    this._scrollbarDiv.style.width = value + 'px';
  }
  
  get contentSize() {
    return parseInt(this._contentProxyDiv.style.width, 10);
  }
  
  get visibleSize() {
    return parseInt(this._scrollbarDiv.style.width, 10);
  }
  
  get position() {
    return this._scrollbarDiv.scrollLeft;
  }
  
  set overflow(mode) {
    this._scrollbarDiv.style.overflowX = mode;
  }
  
  get overflow() {
    return this._scrollbarDiv.style.overflowX;
  }
  
  addListener(scrollHandler) {
    this._scrollbarDiv.addEventListener('scroll', (e) => {
      scrollHandler({
        type: 'scroll',
        target: this
      });
    });
  }
  
  get element() {
    return this._scrollbarDiv;
  }
}

export class VerticalScrollbar {
  constructor(opts) {
    this._scrollbarDiv = document.importNode(scrollbarTemplate.content, true).firstElementChild;
    this._scrollbarDiv.style.height = '0px';
    
    this._contentProxyDiv = this._scrollbarDiv.querySelector('.content-proxy');
    this._contentProxyDiv.style.height = '0px';
    this._contentProxyDiv.style.width = '1px';
    
    if ( opts.contentSize ) this.contentSize = opts.contentSize;
    if ( opts.visibleSize ) this.visibleSize = opts.visibleSize;
    if ( opts.overflow ) this.overflow = opts.overflow;
  }
  
  set contentSize(value) {
    this._contentProxyDiv.style.height = value + 'px';
  }
  
  set visibleSize(value) {
    this._scrollbarDiv.style.height = value + 'px';
  }
  
  get contentSize() {
    return parseInt(this._contentProxyDiv.style.height, 10);
  }
  
  get visibleSize() {
    return parseInt(this._scrollbarDiv.style.height, 10);
  }
  
  get position() {
    return this._scrollbarDiv.scrollTop;
  }
  
  set overflow(mode) {
    this._scrollbarDiv.style.overflowY = mode;
  }
  
  get overflow() {
    return this._scrollbarDiv.style.overflowY;
  }
  
  addListener(scrollHandler) {
    this._scrollbarDiv.addEventListener('scroll', (e) => {
      scrollHandler({
        type: 'scroll',
        target: this
      });
    });
  }
  
  get element() {
    return this._scrollbarDiv;
  }
}
