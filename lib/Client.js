/*jshint node: true */
'use strict';

var net = require('net');

var util = require('util');

var events = require('events');

var RSVP = require('rsvp');

var PeerConnection = require('./PeerConnection');

var Client = module.exports = function(port){
  events.EventEmitter.call(this);
  Object.defineProperties(this, {
    server: {
      enumerable: true,
      value: net.createServer({ allowHalfOpen: true })
    },
    port: {
      enumerable: true,
      value: port
    }
  });
    
  // subscribe to the 'connection' event
  this.server.on('connection', function(socket) {
    this.emit('peer-connected', new PeerConnection(socket));
  }.bind(this));
  
  this.server.on('close', function(e) {
    this.emit('close', e);
  }.bind(this));
  
  this.server.on('error', function(e) {
    this.emit('error', e);
  }.bind(this));
  
  // listen on the port
  this.server.listen(this.port);
};
util.inherits(Client, events.EventEmitter);

Client.prototype.stop = function() {
  var self = this;
  return new RSVP.Promise(function(resolve, reject){
    this.server.close(function(){
      this.server.unref();
      resolve();
    });
  });
};

Client.connect = function(ipAddress, port) {
  var self = this;
  return new RSVP.Promise(function(resolve,reject) {
    var socket = net.connect({
      host: ipAddress,
      port: port,
      allowHalfOpen: true
    }, function() {
      resolve(new PeerConnection(socket));
    });
  });
};