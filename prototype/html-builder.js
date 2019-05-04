
class HtmlBuilder {
  constructor() {
    this._docBuilder = new DocumentBuilder();
  }
  
  open(tag, optContents) {
    this._docBuilder.open(tag, optContents);
    return this;
  }
  
  table(optContents) {
    return this.open('table', optContents);
  }
  
  tbody(optContents) {
    return this.open('tbody', optConents);
  }
  
  tr(optContents) {
    return this.open('tr', optContents);
  }
  
  th(optContents) {
    return this.open('th', optContents);
  }
  
  td(optContents) {
    return this.open('td', optContents);
  }
  
  get() {
    return this._docBuilder.get();
  }
  
  appendTo(node) {
    this._docBuilder.appendTo(node);
  }
}