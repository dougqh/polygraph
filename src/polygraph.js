class ViewportElement extends HTMLElement {
  static importModule() {
    return import('./polygraph-viewport.js');
  }

  constructor() {
    super();
  }
  
  connectedCallback() {
    // wait until the module is loaded and the content is loaded
    
    ViewportElement.importModule().then((viewportModule) => {
      // DQH: TODO: This is loaded checking is ugly, there's got to be a better way.
      if ( this.loaded ) {
        this._setup(viewportModule);
      } else {
        window.addEventListener('DOMContentLoaded', () => {
          this._setup(viewportModule);
        });
      };
    });
  }
  
  get loaded() {
    return window.getComputedStyle(this);
  }
  
  _setup(viewportModule) {
    console.log('Viewport set-up');
    
    const style = window.getComputedStyle(this);
    this._viewport = new viewportModule.Viewport();
    this._viewport.updateStyle(style);
    
    this.after(this._viewport.render());
    
    this.style.display = 'none';
    
    // DQH: 2019 May - Tried ResizeObserver to no avail, since it isn't widely support 
    // decided to listen to window instead.  To avoid too many DOM updates, resizePanels 
    // checks if the bounding rect has changed.
    window.addEventListener('resize', () => this._viewport.resizeHandler());
  }
};

export function defineElements() {
  window.customElements.define('polygraph-viewport', ViewportElement);
};
