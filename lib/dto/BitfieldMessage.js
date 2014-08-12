/*jshint node: true */

'use strict';

var util = require('util');
var Bitfield = require('bitfield');
var PeerMessage = require('./PeerMessage');

var BitfieldMessage = module.exports = function(bytes) {
  PeerMessage.call(this, bytes);
  Object.defineProperties(this,{
    _bitfield: {
      get: function() {
        if (this.bitfield) {
          return this.bitfield.buffer;
        }
        return new Buffer([]);
      }
    },
    bitfield: {
      value: null,
      enumerable: true,
      writable: true
    },
  });
  if (bytes) {
    this.bitfield = new Bitfield(bytes.slice(5));
   
    if (this.id !== BitfieldMessage.Id) {
      throw new Error('Invalid bitfield message id');
    }
  } else {
    this.id = BitfieldMessage.Id;
  }
};
util.inherits(BitfieldMessage, PeerMessage);

Object.defineProperties(BitfieldMessage,{
  Id: {
    value: 5,
    enumerable: true
  }
});

Object.defineProperties(BitfieldMessage.prototype,{
  _keys: {
    value: PeerMessage.prototype._keys.concat([
      '_bitfield'
    ])
  }
});