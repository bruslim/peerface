/*jshint node: true */

'use strict';

var util = require('util');
var PeerMessage = require('./PeerMessage');

var UnchokeMessage = module.exports = function(bytes) {
  PeerMessage.call(this, bytes);
  if (!bytes) {
    this.id = UnchokeMessage.Id;
  } else {
    if (this.id !== UnchokeMessage.Id) {
      throw new Error('Invalid unchoke message id');
    }
  }
};
util.inherits(UnchokeMessage, PeerMessage);

Object.defineProperties(UnchokeMessage,{
  Id: {
    value: 1,
    enumerable: true
  }
});