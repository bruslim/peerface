/*jshint node: true */
'use strict';

var PeerConnection = require('./PeerConnection');
var RSVP = require('rsvp');
var events = require('events');
var net = require('net');
var util = require('util');


/**
* A client which opens a TCP port and listens for incomming connections
* from peers
* @param {Number} port number to listen on
* @return {Client} 
* @module Client
*/
var Client = module.exports = function(port){
  events.EventEmitter.call(this);
  Object.defineProperties(this, {
    /**
    * Server
    * nodejs TCP Server Object
    */
    server: {
      enumerable: true,
      value: net.createServer({ allowHalfOpen: true })
    },
    /**
    * 
    */
    port: {
      enumerable: true,
      value: port
    }
  });
    
  // subscribe to the 'connection' event
  this.server.on('connection', Client.prototype._firePeerConnected.bind(this));
  
  // subscribe to the 'close' event
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
  return new RSVP.Promise(function(resolve){
    self.server.close(resolve);
  });
};

Client.connect = function(ipAddress, port) {
  return new RSVP.Promise(function(resolve) {
    var socket = net.connect({
      host: ipAddress,
      port: port,
      allowHalfOpen: true
    }, function() {
      resolve(new PeerConnection(socket));
    });
  });
};