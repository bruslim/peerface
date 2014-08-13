/*jshint node: true */
'use strict';

var events = require('events');

var util = require('util');

var RSVP = require('rsvp');

var Messages = require('./Messages');

var PeerConnection = module.exports = function(socket){
  events.EventEmitter.call(this);
  this.setMaxListeners(0);
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
    },
    lastMessageReceivedOn: {
      writable: true
    }
  });
  
  this.bindSocket(socket);
};
util.inherits(PeerConnection, events.EventEmitter);

PeerConnection.prototype.close = function() {
  this.clearDeathTimer();
  this._socket.end();
};

PeerConnection.prototype.bindSocket = function(socket) {  
  this._socket = socket;
  var self = this;
  socket.on('end', function() {
    self._socket.end();
  });
  socket.on('data', function(data){
    self.routeData(data);
  });
  socket.on('close', function(had_error) {
    self.clearDeathTimer();
    self.emit('close', had_error);
    if (typeof(self._socket.unref) === "function"){
      self._socket.unref();
    }
  });
  socket.on('error', function(err){
    self.emit('error', err);
  });
  
};

PeerConnection.prototype.clearDeathTimer = function() {
  if (this._deathTimer) {
    clearTimeout(this._deathTimer);
  }
};

PeerConnection.prototype.resetDeathTimer = function() {
  this.lastMessageReceivedOn = new Date();
  this.clearDeathTimer();
  this._deathTimer = setTimeout(PeerConnection.prototype.close.bind(this),120000);
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

  var cursor = 0, msgLen, part;
  var msgs = [];
  
  do {
    // read the length again
    msgLen = data.readInt32BE(cursor);
    
    // slice the data
    part = data.slice(cursor, cursor + msgLen + 4);
    
    // fire the event for the part
    msgs.push(this.fireEvent(part));
    
    // advance the cursor
    cursor += msgLen + 4;

  } while (cursor < data.length - 4);
  
  return msgs;
};

PeerConnection.prototype.fireEvent = function(part) {
  var msg = new Messages.KeepAlive(part);
  if (msg.len === 0) {
    this.emit('keep-alive', msg);
    return msg;
  }
  msg = new Messages.Peer(part);
  switch (msg.id) {
    case Messages.Choke.Id:
      msg = new Messages.Choke(part);
      this.emit('choke', msg);
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
      this.emit('piece',new Messages.Piece(part));
      break;
    case Messages.Cancel.Id:
      this.emit('cancel', new Messages.Cancel(part));
      break;
    case Messages.Port.Id:
      this.emit('port', new Messages.Port(part));
      break;
    default:
      this.emit('unknown', msg);
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
  console.log("sending choke...");
  var msg = new Messages.Choke();
  console.log("choke created");
  console.log("choke body", msg._body);
  var buffer = msg.toBuffer();
  console.log("buffer created");
  this._socket.write(buffer);
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