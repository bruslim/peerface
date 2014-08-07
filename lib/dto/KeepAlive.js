/*jshint node: true */

'use strict';

var util = require('util');
var TcpMessage = require('./TcpMessage');

var KeepAlive = module.exports = function(bytes) {
  TcpMessage.call(this, bytes);
  Object.defineProperties(this,{
    _len: {
      value: new Buffer([0,0,0,0])
    },
    len: {
      enumerable: true,
      get: function() {
        return this._len.readInt32BE(0);
      },
      set: function(value) {
        this._len.writeInt32BE(value,0);
      }
    },
    _body: {
      value: new Buffer(0),
      writable: true
    }
  });
  if (bytes) {
    this.len = bytes.readInt32BE(0);
    this._body = bytes.slice(4);
    if (this._body.length !== this.len) {
      throw new Error("Invalid TCP Message, length of body does not match.");
    }
  }
};
util.inherits(KeepAlive, TcpMessage);

Object.defineProperties(KeepAlive.prototype,{
  _keys: {
    value: [
      '_len'
    ]
  }
});