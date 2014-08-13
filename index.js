/*jshint node: true */

'use strict';

var peerface = module.exports = {
  ClientServer: require('./lib/Client'),
  Messages: require('./lib/Messages'),
  PeerConnection: require('./lib/PeerConnection')
};

peerface.listen = function(port) {
  return new this.ClientServer(port);
};
peerface.connect = function(ipAddress, port) {
  return this.ClientServer.connect(ipAddress, port);
};