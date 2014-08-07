/*jshint node: true */

'use strict';

var util = require('util');
var PeerMessage = require('./PeerMessage');

var HaveMessage = module.exports = function(bytes) {
  PeerMessage.call(this, bytes);
  Object.defineProperties(this,{
    _pieceIndex: {
      value: new Buffer(4)
    },
    pieceIndex: {
      enumerable: true,
      get: function() {
        return this._pieceIndex.readInt32BE(0);
      },
      set: function(value) {
        this._pieceIndex.writeInt32BE(value, 0);
      }
    }
  });
  if (bytes) {
    this.pieceIndex = bytes.readInt32BE(5);
    
    if (this.id !== HaveMessage.Id) {
      throw new Error('Invalid have message id');
    }
    
  } else {
    this.id = HaveMessage.Id;
  }
};
util.inherits(HaveMessage, PeerMessage);

Object.defineProperties(HaveMessage,{
  Id: {
    value: 4,
    enumerable: true
  }
});

Object.defineProperties(HaveMessage.prototype,{
  _keys: {
    value: PeerMessage.prototype._keys.concat([
      '_pieceIndex'
    ])
  }
});