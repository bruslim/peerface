/*jshint node: true */

'use strict';

var util = require('util');
var PeerMessage = require('./PeerMessage');

var BaseRequestMessage = module.exports = function(bytes) {
  PeerMessage.call(this, bytes);
  Object.defineProperties(this, {
    _index: {
      value: new Buffer(4)
    },
    index: {
      enumerable: true,
      get: function() {
        return this._index.readInt32BE(0);
      },
      set: function(value) {
        this.setInt32Value(this._index,value);
      }
    },
    _begin: {
      value: new Buffer(4)
    },
    begin: {
      enumerable: true,
      get: function() {
        return this._begin.readInt32BE(0);
      },
      set: function(value) {
        this.setInt32Value(this._begin,value);
      }
    },
    _length: {
      value: new Buffer(4)
    },
    length: {
      enumerable: true,
      get: function() {
        return this._length.readInt32BE(0);
      },
      set: function(value) {
        this.setInt32Value(this._length,value);
      }    
    }
  });
  if (bytes) {
    this.index = bytes.readInt32BE(5);
    this.begin = bytes.readInt32BE(9);
    this.length = bytes.readInt32BE(13);
  
    
  } 
};
util.inherits(BaseRequestMessage, PeerMessage);

Object.defineProperties(BaseRequestMessage.prototype,{
  _keys: {
    value: PeerMessage.prototype._keys.concat([
      '_index',
      '_begin',
      '_length'
    ])
  }
});