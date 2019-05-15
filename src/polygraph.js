class ViewportElement extends HTMLElement {
  static importModule() {
    return import('./polygraph-viewport.js');
  }

  constructor() {
    super();
    
    this._readyPromise = new Promise((resolve, fail) => {
      this._readyResolver = resolve;
    });
  }
  
  static get observedAttributes() {
    return [
      'content-width',
      'content-height',
      
      'margin-top',
      'margin-right',
      'margin-bottom',
      'margin-left'
    ];
  }
  
  connectedCallback() {
    // wait until the module is loaded and the content is loaded
    
    // Theoretically, we could start importing in the constructor.
    // I suspect the difference is negligible.
    ViewportElement.importModule().then((viewportModule) => {
      // DQH: TODO: This is loaded checking is ugly, there's got to be a better way.
      if ( this._loaded ) {
        this._setup(viewportModule);
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this._setup(viewportModule);
        });
      };
    });
  }
  
  get _loaded() {
    return window.getComputedStyle(this);
  }
  
  get _innerMargins() {
    const margins = {};
    if ( this.hasAttribute('margin-top') ) margins.top = this.getAttribute('margin-top');
    if ( this.hasAttribute('margin-right') ) margins.right = this.getAttribute('margin-right');
    if ( this.hasAttribute('margin-bottom') ) margins.bottom = this.getAttribute('margin-bottom');
    if ( this.hasAttribute('margin-left') ) margins.left = this.getAttribute('margin-left');
    return margins;
  }
  
  _setup(viewportModule) {
    console.log('Viewport set-up');
    
    const style = window.getComputedStyle(this);
    
    this._viewport = new viewportModule.Viewport();
    this._viewport.updateStyle(style);
    
    if ( this.hasAttribute('content-width') ) {
      this._viewport.contentWidth = this.getAttribute('content-width');
    }
    if ( this.hasAttribute('content-height') ) {
      this._viewport.contentHeight = this.getAttribute('content-height');
    }
    this._viewport.innerMargins = this._innerMargins;
    
    this.after(this._viewport.render());
    
    const readyResolver = this._readyResolver;
    readyResolver();
    
    this.style.display = 'none';
    
    // DQH: 2019 May - Tried ResizeObserver to no avail, since it isn't widely support 
    // decided to listen to window instead.  To avoid too many DOM updates, resizePanels 
    // checks if the bounding rect has changed.
    window.addEventListener('resize', () => this._viewport.resizeHandler());
  }
  
  whenReady() {
    return this._readyPromise;
  }
  
  get underlay() {
    return this._viewport.underlay;
  }
  
  get content() {
    return this._viewport.content;
  }
  
  get overlay() {
    return this._viewport.overlay;
  }
  
  get top() {
    return this._viewport.top;
  }
  
  get right() {
    return this._viewport.right;
  }
  
  get bottom() {
    return this._viewport.bottom;
  }
  
  get left() {
    return this._viewport.left;
  }
};

export function defineElements() {
  window.customElements.define('polygraph-viewport', ViewportElement);
  
  return whenDefined();
};

export function whenDefined() {
  return window.customElements.whenDefined('polygraph-viewport');
}
