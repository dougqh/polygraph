class NoNamespaceElementHelper {
  create(tag) {
    return document.createElement(tag);
  }
}

class NamespaceElementHelper {
  constructor(_namespace) {
    this._namespace = _namespace;
  }
  
  create(tag) {
    return document.createElementNS(this._namespace, tag);
  }
}

class SimpleAttributeHandler {
  setAttribute(node, name, value) {
    this._setAttribute(node, name, value);
  }
  
  _setAttribute(node, name, value) {
    node.setAttribute(name, value);
  }
}

class ComplexAttributeHelper extends SimpleAttributeHandler {
  constructor(options) {
    super();
    
    this._attrTranslation = options.attrTranslation || {};
    this._attrValueConverters = options.attrValueConverters || {};
  }
  
  setAttribute(node, name, value) {
    const normalizedName = this._attrTranslation[name] || name;
    
    const converter = this._attrValueConverters[normalizedName];
    if ( converter ) {
      this._setAttribute(node, normalizedName, converter(value));
    } else {
      this._setAttribute(node, normalizedName, value);
    }
  }
}

export class DocumentBuilder {
  constructor(options) {
    options = options || {};
    
    if ( options.ns ) {
      this._elementHelper = new NamespaceElementHelper(options.ns);
    } else {
      this._elementHelper = new NoNamespaceElementHelper();
    }
    
    if ( options.attrTranslation || options.attrValueConverters ) {
      this._attrHelper = new ComplexAttributeHelper({
        attrTranslation: options.attrTranslation,
        attrValueConverters: options.attrValueConverters
      });
    } else {
      this._attrHelper = new SimpleAttributeHelper();
    }
    
    this._fragment = document.createDocumentFragment();
    this._curNode = null;
    this._leaf = false;
  }
  
  _open(tag) {
    if ( this._leaf ) this.close();
  
    const newNode = this._elementHelper.create(tag);
    
    if ( !this._curNode ) {
      this._fragment.appendChild(newNode);
    } else {
      this._curNode.appendChild(newNode);
    }
    this._curNode = newNode;
    
    return this;
  }

  open(tag, optContents) {
    this._open(tag);
    
    if ( optContents) this.contents(optContents);
    
    return this;
  }
  
  leaf(tag) {
    this._open(tag);
    this._leaf = true;
    return this;
  }
  
  id(id) {
    this._curNode.id = id;
  }
  
  _plainAttr(name, value) {
    this._curNode.setAttribute(name, str(value));
    
    return this;
  }

  attr(name, value) {
    this._attrHelper.setAttribute(this._curNode, name, value);
  }
  
  attrs(attrsObj) {
    for ( let name in attrsObj ) {
      this._attrHelper.setAttribute(this._curNode, name, attrsObj[name]);
    }
    
    return this;
  }
  
  datum(name, value) {
    // TODO: Use something else if available
    return this._plainAttr('data-' + name, value);
  }
  
  data(dataObj) {
    for ( let name in dataObj ) {
      this._plainAttr('data-'+ name, value);
    }
    
    return this;
  }
  
  class_(class_) {
    this._curNode.classList.add(class_);
    
    return this;
  }
  
  classes(...classes) {
    this._curNode.classList.add(classes);
    
    return this; 
  }
  
  style(name, value) {
    this._curNode.style[name] = value;
    
    return this;
  }
  
  styles(styleObj) {
    for ( const name in styleObj ) {
      this._curNode.style[name] = styleObj[name];
    }
    
    return this;
  }
  
  empty() {
    return this.close();
  }
  
  contents(contents) {
    if ( typeof contents === 'function' ) {
      const results = contents.apply(this);
      if ( results ) this._text(results);
    } else {
      this._text(contents);
    }
    
    if ( this._leaf ) this.close();
    this.close();
    
    return this;
  }
  
  textContents(value) {
    this.text(value);

    this.close();
    
    return this;
  }
  
  text(value) {
    if ( typeof value === 'function' ) {
      const result = value.apply();
      this._text(result);
    } else {
      this._text(value);
    }
    
    return this;
  }
  
  _text(value) {
    this._curNode.appendChild(document.createTextNode(value));
    
    return this;
  }
  
  close(tag) {
    this._curNode = this._curNode.parentElement;
    this._leaf = false;
    
    return this;
  }
  
  get() {
    return this._fragment;
  }
  
  appendTo(node) {
    node.appendChild(this._fragment);
  }
}