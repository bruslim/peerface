/*jshint node: true */

'use strict';

var util = require('util');
var PeerMessage = require('./PeerMessage');

var InterestedMessage = module.exports = function(bytes) {
  PeerMessage.call(this, bytes);
  if (!bytes) {
    this.id = InterestedMessage.Id;
  } else {
    if (this.id !== InterestedMessage.Id) {
      throw new Error('Invalid interested message id');
    }
  }
};
util.inherits(InterestedMessage, PeerMessage);

Object.defineProperties(InterestedMessage,{
  Id: {
    value: 2,
    enumerable: true
  }
});