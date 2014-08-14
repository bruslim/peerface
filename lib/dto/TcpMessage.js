/*jshint node: true */

'use strict';

var TcpMessage = module.exports = function(bytes) {
  if (bytes && !Buffer.isBuffer(bytes)) {
    throw new TypeError('bytes must be a Buffer');
  }
};

Object.defineProperties(TcpMessage.prototype, {
  _keys: { value: [] }
});

TcpMessage.prototype.toBuffer = function(){
  var self = this;
  return Buffer.concat(this._keys.map(function(key){
    return self[key];
  }));
};

TcpMessage.prototype.setInt32Value = function(buffer, value) {
  buffer.writeInt32BE(value, 0);
};