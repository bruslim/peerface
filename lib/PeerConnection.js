/*jshint node: true */
'use strict';

var events = require('events');

var util = require('util');

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
    _msgQueue: {
      value: [],
      writable: true
    },
    _writeQueue: {
      value: []
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
  
  // rebuild the message from two or more packets
  data = Buffer.concat(this._msgQueue.concat([data]));
  
  // reset the msg queue
  this._msgQueue = [];
  
  // validate the lengths of the data
  if (!this.isValidData(data)) {
    // if not valid, push into queue
    this._msgQueue.push(data);
    // exit
    return;
  }
  
  // start at position 0
  var cursor = 0;
  // array of msgs
  var msgs = [];
  do {
    // read the length again
    var msgLen = data.readInt32BE(cursor);
    
    // slice the data
    var part = data.slice(cursor, cursor + msgLen + 4);
    
    // fire the event for the part
    msgs.push(this.fireEvent(part));
    
    // advance the cursor
    cursor += msgLen + 4;
    
  } while (cursor < data.length - 4);
  
  return msgs;
};

PeerConnection.prototype.isValidData = function(data) {
  var cursor = 0;
  var lenTotal = 0;
  var count = 0;
  do {
    var len = data.readInt32BE(cursor);
    lenTotal += len;
    count++;
    cursor += len + 4;
  } while(cursor < data.length - 4);
  return ((count * 4) + lenTotal) === data.length;
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

PeerConnection.prototype._constructAndFireEvent = function(Constructor, eventName, part) {
  var msg = new Constructor(part);
  this.emit(eventName, msg);
  return msg;
};

PeerConnection.prototype.fireEvent[Messages.Choke.Id] = function(part) {
  return this._constructAndFireEvent(Messages.Choke, 'choke', part);
};

PeerConnection.prototype.fireEvent[Messages.Unchoke.Id] = function(part) {
  return this._constructAndFireEvent(Messages.Unchoke, 'unchoke', part);
};

PeerConnection.prototype.fireEvent[Messages.Interested.Id] = function(part) {
  return this._constructAndFireEvent(Messages.Interested, 'interested', part);
};

PeerConnection.prototype.fireEvent[Messages.NotInterested.Id] = function(part) {
  return this._constructAndFireEvent(Messages.NotInterested, 'not-interested', part);
};

PeerConnection.prototype.fireEvent[Messages.Have.Id] = function(part) {
  return this._constructAndFireEvent(Messages.Have, 'have', part);
};

PeerConnection.prototype.fireEvent[Messages.Bitfield.Id] = function(part) {
  return this._constructAndFireEvent(Messages.Bitfield, 'bitfield', part);
};

PeerConnection.prototype.fireEvent[Messages.Request.Id] = function(part) {
  return this._constructAndFireEvent(Messages.Request, 'request', part);
};

PeerConnection.prototype.fireEvent[Messages.Piece.Id] = function(part) {
  return this._constructAndFireEvent(Messages.Piece, 'piece', part);
};

PeerConnection.prototype.fireEvent[Messages.Cancel.Id] = function(part) {
  return this._constructAndFireEvent(Messages.Cancel, 'cancel', part);
};

PeerConnection.prototype.fireEvent[Messages.Port.Id] = function(part) {
  return this._constructAndFireEvent(Messages.Port, 'port', part);
};

PeerConnection.prototype.write = function(msg) {
  if (!msg || !msg.toBuffer || typeof(msg.toBuffer) !== 'function') {
    throw new TypeError("msg must have toBuffer()");
  }
  // throttle writes
  this._writeQueue.push(msg);
  process.nextTick(PeerConnection.prototype._write.bind(this));
};

PeerConnection.prototype._write = function() {
  if (this._writeQueue.length === 0) return;
  var msg = this._writeQueue.shift();
  var self = this;
  this._socket.write(msg.toBuffer(), null, function() {
    process.nextTick(PeerConnection.prototype._write.bind(self));
  });
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

PeerConnection.prototype._request = function(Constructor, index, begin, length) {
  this.write((new Constructor()).init({
    index  : index,
    begin  : begin,
    length : length
  }));
};

PeerConnection.prototype.request  = function(index, begin, length){
  this._request(Messages.Request, index, begin, length);
};

PeerConnection.prototype.cancel  = function(index, begin, length){
  this._request(Messages.Cancel, index, begin, length);
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