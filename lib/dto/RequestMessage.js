/*jshint node: true */

'use strict';

var util = require('util');
var BaseRequestMessage = require('./BaseRequestMessage');

var RequestMessage = module.exports = function(bytes) {
  BaseRequestMessage.call(this, bytes);
  
  if (bytes) {
    if (this.id !== RequestMessage.Id) {
      throw new Error('Invalid request message id');
    } 
  } else {
    this.id = RequestMessage.Id;
  }
};
util.inherits(RequestMessage, BaseRequestMessage);

Object.defineProperties(RequestMessage,{
  Id: {
    value: 6,
    enumerable: true
  }
});