/*jshint node: true */
'use strict';

var events = require('events');

var util = require('util');

var RSVP = require('rsvp');

var Messages = require('./Messages');

var PeerConnection = module.exports = function(socket){
  events.EventEmitter.call(this);
  
  Object.defineProperties(this,{
    infoHash: {
      writable: true,
      enumerable: true
    },
    peerId: {
      writable: true,
      enumerable: true
    },
    _socket: {
      writable: true,
    },
    handshakeReceived: {
      value: false,
      writable: true,
      enumerable: true
    },
    _deathTimer: {
      writable: true
    }
  });
  
  this.bindSocket(socket);
};
util.inherits(PeerConnection, events.EventEmitter);

PeerConnection.prototype.bindSocket = function(socket) {  
  var self = this;
  socket.on('data', function(data){
    self.routeData(data);
  });
  socket.on('close', function(had_error) {
    self.emit('close', had_error);
  });
  socket.on('error', function(err){
    self.emit('error', err);
  });
  this._socket = socket;
};

PeerConnection.prototype.resetDeathTimer = function() {
  if (!this._deathTimer) {
    clearTimeout(this._deathTimer);
  }
  var self = this;
  this._deathTimer = setTimeout(function(){
    // when the time out expires, kill the socket.
    self._socket.destroy();
  },120000);
};

PeerConnection.prototype.routeData = function(data) {
  this.resetDeathTimer();
  if (!this.handshakeReceived) {
    var handshake = new Messages.Handshake(data);
    this.infoHash = handshake.infoHash;
    this.peerId = handshake.peerId;
    this.handshakeReceived = true;
    this.emit('handshake', handshake);
    return;
  }

  var msgLen = data.readInt32BE(0);
  if (msgLen === 0) {
    // we already reset the Death Timer
    return;
  }

  var cursor = 0;
  do {
    // 4 for the len integer
    var msg = this.fireEvent(data.slice(cursor, cursor + msgLen + 4));
    msgLen = msg.len;
    cursor += msgLen + 4;
    
  } while (cursor < data.length);
};

PeerConnection.prototype.fireEvent = function(part) {
  var msg = new Messages.Peer(part);
  switch (msg.id) {
    case Messages.Choke.Id:
      this.emit('choke', new Messages.Choke(part));
      break;
    case Messages.Unchoke.Id:
      this.emit('unchoke', new Messages.Unchoke(part));
      break;
    case Messages.Interested.Id:
      this.emit('interested', new Messages.Interested(part));
      break;
    case Messages.NotInterested.Id:
      this.emit('not-interested',new Messages.NotInterested(part));
      break;
    case Messages.Have.Id:
      this.emit('have', new Messages.Have(part));
      break;
    case Messages.Bitfield.Id:
      this.emit('bitfield', new Messages.Bitfield(part));
      break;
    case Messages.Request.Id:
      this.emit('request',new Messages.Request(part));
      break;
    case Messages.Piece.Id:
      this.emit('peice',new Messages.Piece(part));
      break;
    case Messages.Cancel.Id:
      this.emit('cancel', new Messages.Cancel(part));
      break;
    case Messages.Port.Id:
      this.emit('port', new Messages.Port(part));
      break;
  }
  return msg;
};

PeerConnection.prototype.handshake = function(peerId, infoHash) {
  // create the message
  var msg = new Messages.Handshake();
  
  // set the peer id
  msg.peerId = peerId;
  
  // set the info hash
  msg.infoHash = infoHash;
  
  // send the message
  this._socket.write(msg.toBuffer());
};

PeerConnection.prototype.keepAlive = function() {
  this._socket.write((new Messages.KeepAlive()).toBuffer());
};

PeerConnection.prototype.choke = function() {
  this._socket.write((new Messages.Choke()).toBuffer());
};

PeerConnection.prototype.unchoke = function() {
  this._socket.write((new Messages.Unchoke()).toBuffer());
};

PeerConnection.prototype.interested = function() {
  this._socket.write((new Messages.Interested()).toBuffer());
};

PeerConnection.prototype.notInterested = function() {
  this._socket.write((new Messages.NotInterested()).toBuffer());
};

PeerConnection.prototype.have = function(pieceIndex) {
  var msg = new Messages.Have();
  msg.pieceIndex = pieceIndex;
  this._socket.write(msg.toBuffer());
};

PeerConnection.prototype.bitfield = function(bitfield) {
  var msg = new Messages.Bitfield();
  msg.bitfield = bitfield;
  this._socket.write(msg.toBuffer());
};

PeerConnection.prototype.request  = function(index, begin, length){
  var msg = new Messages.Request();
  msg.index = index;
  msg.begin = begin;
  msg.length = length;
  this._socket.write(msg.toBuffer());
};

PeerConnection.prototype.cancel  = function(index, begin, length){
  var msg = new Messages.Cancel();
  msg.index = index;
  msg.begin = begin;
  msg.length = length;
  this._socket.write(msg.toBuffer());
};

PeerConnection.prototype.piece  = function(index, begin, block){
  var msg = new Messages.Piece();
  msg.index = index;
  msg.begin = begin;
  msg.length = block;
  this._socket.write(msg.toBuffer());
};

PeerConnection.prototype.port = function(listenPort) {
  var msg = new Messages.Port();
  msg.listenPort = listenPort;
  this._socket.write(msg.toBuffer());
};