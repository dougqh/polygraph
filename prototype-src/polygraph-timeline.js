export class SwimlaneSpace {
  constructor() {
    this._lanes = [];
  }
  
  add(id, optLabel) {
    const obj = {id: id};
    if ( optLabel ) obj.label = optLabel;
    
    this._lanes.push(obj);
  }
  
  get first() {
    return this._lanes[0];
  }
  
  get last() {
    return this._lanes[this._lanes.length - 1];
  }
  
  toNum(id) {
    // Number of lanes is small-ish (<100), so we can afford a search
    for ( let i = 0; i < this._lanes.length; i += 1 ) {
      if ( this._lanes[i].id === id ) return i;
    }
    throw new Error('ID not found: ' + id);
  }
}