/*jshint node: true */

'use strict';

var util = require('util');
var PeerMessage = require('./PeerMessage');

var PortMessage = module.exports = function(bytes) {
  PeerMessage.call(this, bytes);
  Object.defineProperties(this, {
    _listenPort: {
      value: new Buffer(2)
    },
    listenPort: {
      enumerable: true,
      get: function() {
        return this._listenPort.readInt16BE(0);
      },
      set: function(value) {
        this._listenPort.writeInt16BE(value, 0);
      }
    }
  });
  if (bytes) {
    this.listenPort = bytes.readInt16BE(5);
     
    if (this.id !== PortMessage.Id) {
      throw new Error('Invalid port message id');
    }
  
  } else {
    this.id = PortMessage.Id;
  }
};
util.inherits(PortMessage, PeerMessage);

Object.defineProperties(PortMessage,{
  Id: {
    value: 9,
    enumerable: true
  }
});

Object.defineProperties(PortMessage.prototype,{
  _keys: {
    value: PeerMessage.prototype._keys.concat([
      '_listenPort'
    ])
  }
});