/*jshint node: true */

'use strict';

var util = require('util');
var PeerMessage = require('./PeerMessage');

var NotInterestedMessage = module.exports = function(bytes) {
  PeerMessage.call(this, bytes);
  if (!bytes) {
    this.id = NotInterestedMessage.Id;
  } else {
    if (this.id !== NotInterestedMessage.Id) {
      throw new Error('Invalid not-interested message id');
    }
  }
};
util.inherits(NotInterestedMessage, PeerMessage);

Object.defineProperties(NotInterestedMessage,{
  Id: {
    value: 3,
    enumerable: true
  }
});