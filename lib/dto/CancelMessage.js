/*jshint node: true */

'use strict';

var util = require('util');
var BaseRequestMessage = require('./BaseRequestMessage');

var CancelMessage = module.exports = function(bytes) {
  BaseRequestMessage.call(this, bytes);
  if (!bytes) {
    this.id = CancelMessage.Id;
  } else {
    if (this.id !== CancelMessage.Id) {
      throw new Error('Invalid cancel message id');
    }
  }
};
util.inherits(CancelMessage, BaseRequestMessage);

Object.defineProperties(CancelMessage,{
  Id: {
    value: 8,
    enumerable: true
  }
});