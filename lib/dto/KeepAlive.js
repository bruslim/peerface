/*jshint node: true */

'use strict';

var util = require('util');
var TcpMessage = require('./TcpMessage');

var KeepAlive = module.exports = function(bytes) {
  TcpMessage.call(this, bytes);
  if (!!bytes) {
    Object.defineProperties(this, {
      len: {
        enumerable: true,
        get: function() {
          return this._len.readInt32BE(0);
        }
      },
      _len: {
        value: bytes.slice(0,4)
      },
      _body: {
        value: bytes.slice(4)
      }
    });
    if (this._body.length !== this.len) {
      throw new Error("Invalid TCP Message, length of body does not match.");
    }
  } else {
    Object.defineProperties(this,{
      _body: {
        get: function() {
          var self = this;
          return Buffer.concat(this._keys.filter(function(key){
            return key !== '_len';
          }).map(function(key){
            return self[key];
          }));
        }
      },
      len: {
        enumerable: true,
        get: function() {
          var len = this._body.length;
          return len;
        }
      },
      _len: {
        get: function() {
          var buffer = new Buffer(4);
          buffer.writeInt32BE(this.len,0);
          return buffer;
        }
      }
    });
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