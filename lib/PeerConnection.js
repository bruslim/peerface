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
  var func = PeerConnection.prototype.fireEvent[msg.id];
  if (func) {
    return func.call(this, part);
  }
  this.emit('unknown', msg);
  return msg;
};

PeerConnection.prototype.fireEvent[Messages.Choke.Id] = function(part) {
  var msg = new Messages.Choke(part);
  this.emit('choke', msg);
  return msg;
};

PeerConnection.prototype.fireEvent[Messages.Unchoke.Id] = function(part) {
  var msg = new Messages.Unchoke(part);
  this.emit('unchoke', msg);
  return msg;
};

PeerConnection.prototype.fireEvent[Messages.Interested.Id] = function(part) {
  var msg = new Messages.Interested(part);
  this.emit('interested', msg);
  return msg;
};

PeerConnection.prototype.fireEvent[Messages.NotInterested.Id] = function(part) {
  var msg = new Messages.NotInterested(part);
  this.emit('not-interested', msg);
  return msg;
};

PeerConnection.prototype.fireEvent[Messages.Have.Id] = function(part) {
  var msg = new Messages.Have(part);
  this.emit('have', msg);
  return msg;
};

PeerConnection.prototype.fireEvent[Messages.Bitfield.Id] = function(part) {
  var msg = new Messages.Bitfield(part);
  this.emit('bitfield', msg);
  return msg;
};

PeerConnection.prototype.fireEvent[Messages.Request.Id] = function(part) {
  var msg = new Messages.Request(part);
  this.emit('request', msg);
  return msg;
};

PeerConnection.prototype.fireEvent[Messages.Piece.Id] = function(part) {
  var msg = new Messages.Piece(part);
  this.emit('piece', msg);
  return msg;
};

PeerConnection.prototype.fireEvent[Messages.Cancel.Id] = function(part) {
  var msg = new Messages.Cancel(part);
  this.emit('cancel', msg);
  return msg;
};

PeerConnection.prototype.fireEvent[Messages.Port.Id] = function(part) {
  var msg = new Messages.Port(part);
  this.emit('port', msg);
  return msg;
};

PeerConnection.prototype.write = function(msg) {
  if (!msg || !msg.toBuffer || typeof(msg.toBuffer) !== 'function') {
    throw new TypeError("msg must have toBuffer()");
  }
  this._socket.write(msg.toBuffer());
};

PeerConnection.prototype.handshake = function(peerId, infoHash) {
  // create the message
  var msg = new Messages.Handshake();
  
  // set the peer id
  msg.peerId = peerId;
  
  // set the info hash
  msg.infoHash = infoHash;
  
  // send the message
  this.write(msg);
};

PeerConnection.prototype.keepAlive = function() {
  this.write(new Messages.KeepAlive());
};

PeerConnection.prototype.choke = function() {
  this.write(new Messages.Choke());
};

PeerConnection.prototype.unchoke = function() {
  this.write(new Messages.Unchoke());
};

PeerConnection.prototype.interested = function() {
  this.write(new Messages.Interested());
};

PeerConnection.prototype.notInterested = function() {
  this.write(new Messages.NotInterested());
};

PeerConnection.prototype.have = function(pieceIndex) {
  this.write((new Messages.Have()).init({
    pieceIndex : pieceIndex
  }));
};

PeerConnection.prototype.bitfield = function(bitfield) {
  this.write((new Messages.Bitfield()).init({
    bitfield : bitfield
  }));
};

PeerConnection.prototype.request  = function(index, begin, length){
  this.write((new Messages.Request()).init({
    index  : index,
    begin  : begin,
    length : length
  }));
};

PeerConnection.prototype.cancel  = function(index, begin, length){
  this.write((new Messages.Cancel()).init({
    index  : index,
    begin  : begin,
    length : length
  }));
};

PeerConnection.prototype.piece  = function(index, begin, block){
  this.write((new Messages.Piece()).init({
    index : index,
    begin : begin,
    block : block
  }));
};

PeerConnection.prototype.port = function(listenPort) {
  this.write((new Messages.Port()).init({
    listenPort : listenPort
  }));
};