/*jshint node: true */

'use strict';

var util = require('util');
var KeepAlive = require('./KeepAlive');

var PeerMessage = module.exports = function(bytes) {
  KeepAlive.call(this, bytes);
  Object.defineProperties(this,{
    _id: {
      value: new Buffer(1)
    },
    id: {
      enumerable: true,
      get: function() {
        return this._id.readUInt8(0);
      },
      set: function(value) {
        this._id.writeUInt8(value, 0);
      }
    }
  });
  if (this._body.length > 0) {
    this.id = this._body.readUInt8(0);
  }
};
util.inherits(PeerMessage, KeepAlive);

Object.defineProperties(PeerMessage.prototype,{
  _keys: {
    value: KeepAlive.prototype._keys.concat([
      '_id'
    ])
  }
});

Object.defineProperties(PeerMessage,{
  Id: {
    value: -1,
    enumerable: true
  }
});