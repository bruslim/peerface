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
  this.server.on('connection', Client.prototype._firePeerConnected.bind(this));
  
  this.server.on('close', Client.prototype._fireStopped.bind(this));
  
  this.server.on('error', Client.prototype._fireError.bind(this));
  
  // listen on the port
  this.server.listen(this.port);
};
util.inherits(Client, events.EventEmitter);

Client.prototype._firePeerConnected = function(socket) {
  this.emit('peer-connected', new PeerConnection(socket));
};

Client.prototype._fireStopped = function(had_error) {
  this.emit('stopped', !!had_error);
  this.server.unref();
};

Client.prototype._fireError = function(err) {
  this.emit('error', err);
};

Client.prototype.stop = function() {
  this.emit('stopping', new Date());
  var self = this;
  return new RSVP.Promise(function(resolve, reject){
    this.server.close(resolve);
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