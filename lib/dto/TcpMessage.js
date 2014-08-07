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
  var buffers = [];
  this._keys.forEach(function(key){
    buffers.push(this[key]);
  },this);
  return Buffer.concat(buffers);
};

TcpMessage.prototype.setInt32Value = function(buffer, value) {
  buffer.writeInt32BE(value, 0);
};