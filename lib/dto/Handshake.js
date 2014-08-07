/*jshint node: true */

'use strict';

var util = require('util');
var TcpMessage = require('./TcpMessage');

var Handshake = module.exports = function Handshake(bytes) {
  TcpMessage.call(this, bytes);
  Object.defineProperties(this, {
    _pstrlen: {
      get: function() {
        var buffer = new Buffer(1);
        buffer.writeUInt8(this.pstrlen, 0);
        return buffer;
      }
    },
    pstrlen: {
      enumerable: true,
      get: function() {
        return this.pstr.length;
      }
    },
    _pstr: {
      get: function() {
        return new Buffer(this.pstr);
      }
    },
    pstr: {
      value: "BitTorrent protocol",
      writable: true,
      enumerable: true,
    },
    _reserved: {
      value: new Buffer([0,0,0,0,0,0,0])
    },
    _infoHash: {
      value: new Buffer(20)
    },
    infoHash: {
      enumerable: true,
      get: function() {
        return this._infoHash.toString('base64');
      },
      set: function(value) {
        if (!Buffer.isBuffer(value)) {
          value = new Buffer(value, 'base64');
        }
        value.copy(this._infoHash);
      }
    },
    _peerId: {
      value: new Buffer(20)
    },
    peerId: {
      enumerable: true,
      get: function() {
        return this._peerId.toString();
      },
      set: function(value) {
        this._peerId.write(value);
      }
    }
  });
  if (bytes) {
    var pstrlen = bytes.readUInt8(0);
    if (bytes.length < (pstrlen + 49)) {
      throw new Error("bytes length is invalid");
    }
    this.pstr = bytes.slice(1,pstrlen+1).toString();
    this.infoHash = bytes.slice(pstrlen+9,pstrlen+29);
    this.peerId = bytes.slice(pstrlen+29,pstrlen+49).toString();
  }
};

util.inherits(Handshake, TcpMessage);

Object.defineProperties(Handshake.prototype, {
  _keys: {
    value: [
      '_pstrlen',
      '_pstr',
      '_reserved',
      '_infoHash',
      '_peerId'
    ]
  }
});

