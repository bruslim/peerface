/*jshint node: true */

'use strict';

var util = require('util');
var PeerMessage = require('./PeerMessage');

var PieceMessage = module.exports = function(bytes) {
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
    block: {
      value: new Buffer(0),
      writable: true,
      enumerable: true,
    }
  });
  if (bytes) {
    this.index = bytes.readInt32BE(5);
    this.begin = bytes.readInt32BE(9);
    this.block = bytes.slice(13);
    
    if (this.id !== PieceMessage.Id) {
      throw new Error('Invalid piece message id');
    }
  
  } else {
    this.id = PieceMessage.Id;
  }
};
util.inherits(PieceMessage, PeerMessage);

Object.defineProperties(PieceMessage,{
  Id: {
    value: 7,
    enumerable: true
  }
});

Object.defineProperties(PieceMessage.prototype,{
  _keys: {
    value: PeerMessage.prototype._keys.concat([
      '_index',
      '_begin',
      'block'
    ])
  }
});