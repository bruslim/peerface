/*jshint node: true */

'use strict';

var util = require('util');
var PeerMessage = require('./PeerMessage');

var ChokeMessage = module.exports = function(bytes) {
  PeerMessage.call(this, bytes);
  if (!bytes) {
    this.id = ChokeMessage.Id;
  } else {
    if (this.id !== ChokeMessage.Id) {
      throw new Error('Invalid choke message id');
    }
  }
};
util.inherits(ChokeMessage, PeerMessage);

Object.defineProperties(ChokeMessage,{
  Id: {
    value: 0,
    enumerable: true
  }
});