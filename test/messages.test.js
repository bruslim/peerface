/*jshint node: true */

'use strict';

var events = require('events');

var crypto = require('crypto');

var test = require('tape');

var Bitfield = require('bitfield');

var RSVP = require('rsvp');

var lib = require('../index');

var infoHash = crypto.randomBytes(20);
var peerId = crypto.randomBytes(10).toString('hex');
var pstrlen = new Buffer(1);
pstrlen.writeUInt8(19,0);
var handshakeMessage = Buffer.concat([
  // pstrlen
  pstrlen,
  // pstr
  new Buffer('BitTorrent protocol'),
  // reserved
  new Buffer([0,0,0,0,0,0,0,0]),
  // info hash
  infoHash,
  // peer_id
  new Buffer(peerId)
]);
var messages = {
  keepAlive: new Buffer([0,0,0,0]),
  choke: new Buffer([0,0,0,1,0]), 
  unchoke: new Buffer([0,0,0,1,1]),
  interested: new Buffer([0,0,0,1,2])
};

test('handshake dto test', function(t){
 
  var bytes = handshakeMessage;
  var msg = new lib.Messages.Handshake(bytes);
  
  t.equal(msg.pstrlen, 19, 'pstrlen should be 19');
  t.equal(msg.pstr, 'BitTorrent protocol', "pstr should be 'BitTorrent protocol'");
  t.deepEqual(msg._infoHash, infoHash, "info_hashes should match");
  t.equal(msg.peerId, peerId, "peer_ids should match");
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  t.end();
  
});

test('keep-alive dto test', function(t) {
  var bytes = messages.keepAlive;
  var msg = new lib.Messages.KeepAlive(bytes);
  
  t.equal(msg.len, 0, 'message len should be 0');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
});

test('choke dto test', function(t) {
  var bytes = messages.choke;
  var msg = new lib.Messages.Choke(bytes);
  
  t.equal(msg.len, 1, 'message len should be 1');
  t.equal(msg.id, 0, 'message id should be 0');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
});

test('unchoke dto test', function(t) {
  var bytes = messages.unchoke;
  var msg = new lib.Messages.Unchoke(bytes);

  t.equal(msg.len, 1, 'message len should be 1');
  t.equal(msg.id, 1, 'message id should be 1');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
});

test('interested dto test', function(t) {
  var bytes = messages.interested;
  var msg = new lib.Messages.Interested(bytes);

  t.equal(msg.len, 1, 'message len should be 1');
  t.equal(msg.id, 2, 'message id should be 2');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
});

test('not-interested dto test', function(t) {
  var bytes = messages.notInterested = new Buffer([0,0,0,1,3]);
  var msg = new lib.Messages.NotInterested(bytes);

  t.equal(msg.len, 1, 'message len should be 1');
  t.equal(msg.id, 3, 'message id should be 3');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
});

test('have dto test', function(t) {
  var bytes = messages.have = new Buffer([0,0,0,5,4,0,0,0,1]);
  var msg = new lib.Messages.Have(bytes);
  
  t.equal(msg.len, 5, 'message len should be 1');
  t.equal(msg.id, 4, 'message id should be 4');
  t.equal(msg.pieceIndex, 1, 'message piece index should be 1');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
});

test('bitfield dto test', function(t) {
  var bitfield = new Bitfield(256);
  bitfield.set(128);
  
  var length = bitfield.buffer.length+1;
  
  var len = new Buffer(4);
  len.writeInt32BE(length,0);
  
  var bytes = messages.bitfield = Buffer.concat([
    len,
    new Buffer([5]),
    bitfield.buffer
  ]);

  var msg = new lib.Messages.Bitfield(bytes);
  
  t.equal(msg.len, length, 'message len should be ' + length);
  t.equal(msg.id, 5, 'message id should be 5');
  t.deepEquals(msg.bitfield, bitfield, 'bitfields should match');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
});

test('request dto test', function(t) {
  var bytes = messages.request = new Buffer([
    0,0,0,13,
    6,
    0,0,0,0,
    0,0,0,0,
    0,0,0,5
  ]);
  
  var msg = new lib.Messages.Request(bytes);
  
  t.equal(msg.len, 13, 'message len should be 1');
  t.equal(msg.id, 6, 'message id should be 6');
  t.equal(msg.index, 0, 'message index should be 0');
  t.equal(msg.begin, 0, 'message index should be 0');
  t.equal(msg.length, 5, 'message index should be 5');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
});

test('piece dto test', function(t){
  var block = crypto.randomBytes(4);
  
  var bytes = messages.piece = Buffer.concat([
    new Buffer([
      0,0,0,13, 
      7,
      0,0,0,0,
      0,0,0,0
    ]),
    block
  ]);
  
  var msg = new lib.Messages.Piece(bytes);
  
  t.equal(msg.len, 13, 'message len should be 13');
  t.equal(msg.id, 7, 'message id should be 7');
  t.equal(msg.index, 0, 'message index should be 0');
  t.equal(msg.begin, 0, 'message begin should be 0');
  t.deepEqual(msg.block,block, 'message block should match');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
});

test('cancel dto test', function(t){
  var bytes = messages.cancel = new Buffer([
    0,0,0,13,
    8,
    0,0,0,0,
    0,0,0,0,
    0,0,0,5
  ]);
  
  var msg = new lib.Messages.Cancel(bytes);
  
  t.equal(msg.len, 13, 'message len should be 1');
  t.equal(msg.id, 8, 'message id should be 8');
  t.equal(msg.index, 0, 'message index should be 0');
  t.equal(msg.begin, 0, 'message index should be 0');
  t.equal(msg.length, 5, 'message index should be 5');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
});

test('port dto test', function(t){
  var bytes = messages.port = new Buffer([
    0,0,0,3,
    9,
    0,10
  ]);
  
  var msg = new lib.Messages.Port(bytes);
  
  t.equal(msg.len, 3, 'message len should be 1');
  t.equal(msg.id, 9, 'message id should be 8');
  t.equal(msg.listenPort, 10, 'message listenPort should be 10');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
});

test('unknown dto test', function(t) {
  
  var bytes = messages.unknown = new Buffer([
    0,0,0,1,
    15
  ]);
  
  var msg = new lib.Messages.Peer(bytes);
  
  t.equal(msg.len, 1, 'message len should be 1');
  t.equal(msg.id, 15, 'message id should be 8');
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  
  t.end();
  
});


test('route data test', function(t) {
  var mockSocket = new events.EventEmitter();
  var peer = new lib.PeerConnection(mockSocket);
  
  
  t.plan(14);
  
  t.test("handshake", function(t) {
  
    peer.once('handshake', function(e) { 
      t.deepEqual(handshakeMessage, e.toBuffer(), "handshake should be the same");
    });
    
    t.plan(1);
    
    peer.routeData(handshakeMessage);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });

  t.test("keep alive", function(t) {
    peer.once('keep-alive', function(e) {
      t.deepEqual(messages.keepAlive, e.toBuffer(), "keep-alive should be the same");
    });

    t.plan(1);

    peer.routeData(messages.keepAlive);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.test("choke", function(t) {
    peer.once('choke', function(e) {
      t.deepEqual(messages.choke, e.toBuffer(), "choke should be the same");
    });

    t.plan(1);

    peer.routeData(messages.choke);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.test("unchoke", function(t) {
    peer.once('unchoke', function(e) {
      t.deepEqual(messages.unchoke, e.toBuffer(), "unchoke should be the same");
    });

    t.plan(1);

    peer.routeData(messages.unchoke);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.test("interested", function(t) {
    peer.once('interested', function(e) {
      t.deepEqual(messages.interested, e.toBuffer(), "interested should be the same");
    });

    t.plan(1);

    peer.routeData(messages.interested);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.test("not-interested", function(t) {
    peer.once('not-interested', function(e) {
      t.deepEqual(messages.notInterested, e.toBuffer(), "not-interested should be the same");
    });

    t.plan(1);

    peer.routeData(messages.notInterested);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.test("have", function(t) {
    peer.once('have', function(e) {
      t.deepEqual(messages.have, e.toBuffer(), "have should be the same");
    });

    t.plan(1);

    peer.routeData(messages.have);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.test("bitfield", function(t) {
    peer.once('bitfield', function(e) {
      t.deepEqual(messages.bitfield, e.toBuffer(), "bitfield should be the same");
    });

    t.plan(1);

    peer.routeData(messages.bitfield);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
 
  t.test("request", function(t) {
    peer.once('request', function(e) {
      t.deepEqual(messages.request, e.toBuffer(), "request should be the same");
    });

    t.plan(1);

    peer.routeData(messages.request);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.test("piece", function(t) {
    peer.once('piece', function(e) {
      t.deepEqual(messages.piece, e.toBuffer(), "piece should be the same");
    });

    t.plan(2);

    t.equal(peer.routeData(messages.piece).length, 1, "should have routed 1 message");
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.test("cancel", function(t) {
    peer.once('cancel', function(e) {
      t.deepEqual(messages.cancel, e.toBuffer(), "cancel should be the same");
    });
    

    t.plan(1);

    peer.routeData(messages.cancel);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.test("port", function(t) {
    peer.once('port', function(e) {
      t.deepEqual(messages.port, e.toBuffer(), "port should be the same");
    });

    t.plan(1);

    peer.routeData(messages.port);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.test("unknown", function(t) {
    
    peer.once('unknown', function(e){
      t.deepEqual(messages.unknown, e.toBuffer(), "unknown should be the same");
    });
    
    t.plan(1);
    
    peer.routeData(messages.unknown);
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.test("all the messages", function(t) {
    peer.once('keep-alive', function(e) {
      t.deepEqual(messages.keepAlive, e.toBuffer(), "keep-alive should be the same");
      clearTimeout(peer._deathTimer);
    });
    peer.once('choke', function(e) {
      t.deepEqual(messages.choke, e.toBuffer(), "choke should be the same");
      clearTimeout(peer._deathTimer);
    });
    peer.once('unchoke', function(e) {
      t.deepEqual(messages.unchoke, e.toBuffer(), "unchoke should be the same");
      clearTimeout(peer._deathTimer);
    });
    peer.once('interested', function(e) {
      t.deepEqual(messages.interested, e.toBuffer(), "interested should be the same");
      clearTimeout(peer._deathTimer);
    });
    peer.once('not-interested', function(e) {
      t.deepEqual(messages.notInterested, e.toBuffer(), "not-interested should be the same");
      clearTimeout(peer._deathTimer);
    });
    peer.once('have', function(e) {
      t.deepEqual(messages.have, e.toBuffer(), "have should be the same");
      clearTimeout(peer._deathTimer);
    });
    peer.once('bitfield', function(e) {
      t.deepEqual(messages.bitfield, e.toBuffer(), "bitfield should be the same");
      clearTimeout(peer._deathTimer);
    });
    peer.once('request', function(e) {
      t.deepEqual(messages.request, e.toBuffer(), "request should be the same");
      clearTimeout(peer._deathTimer);
    });
    peer.once('piece', function(e) {
      t.deepEqual(messages.piece, e.toBuffer(), "piece should be the same");
      clearTimeout(peer._deathTimer);
    });
    peer.once('cancel', function(e) {
      t.deepEqual(messages.cancel, e.toBuffer(), "cancel should be the same");
      clearTimeout(peer._deathTimer);
    });  
    peer.once('port', function(e) {
      t.deepEqual(messages.port, e.toBuffer(), "port should be the same");
      clearTimeout(peer._deathTimer);
    });
    
    peer.once('error', function(e) {
      t.equal("error test", e, "error should be emitted");
      clearTimeout(peer._deathTimer);
    });
    
    peer.once('close', function(e) {
      t.equal("close test", e, "close should be emitted");
      clearTimeout(peer._deathTimer);
    });

    var keys = Object.keys(messages);
    var bytes = Buffer.concat(keys.map(function(key){ return messages[key]; }));
    
    t.plan(keys.length+2);
    
    mockSocket.emit('data', bytes);
    mockSocket.emit('error', "error test");
    mockSocket.emit('close', "close test");
    
    //t.equal(peer.routeData(bytes).length, keys.length, "should have " + keys.length + " messages");
    
    // clear the deathTimer since this seems to hang tape
    //
    
  });
  
  t.end();
});

test('send/recieve messages', function(t) {
  
  t.plan(3);

  var defered = [];
  
  var server = lib.listen(65001);
  server.on('peer-connected', function(peer){
    
    peer._socket.on('data', function(bytes) {
      console.log('data', bytes);
    });
    
    peer.on('handshake', function(e){
      t.deepEqual(handshakeMessage, e.toBuffer(), "handshake should equal");
      defered.pop().resolve();
    });
    
    peer.on('keep-alive', function(e) {
      t.deepEqual(messages.keepAlive, e.toBuffer(), "keep-alive should equal");
      defered.pop().resolve();
    });
    
    peer.on('choke', function(e) {
      t.deepEqual(messages.choke, e.toBuffer(), "choke should equal");
      defered.pop().resolve();
    });
    
    
    peer.on('unknown',function(e) {
      console.log('unknown', e);
    });
  });

  function next() {
    var d = RSVP.defer();
    defered.push(d);
    return d.promise;
  }
  
  var connected = lib.connect('localhost', 65001);
  connected.then(function(remote){
    var handshake = new lib.Messages.Handshake(handshakeMessage);
    remote.handshake(handshake.peerId, handshake.infoHash);
    next().then(function(){
      remote.keepAlive();
      return next();
    }).then(function(){
      remote.choke();
      return next();
    }).then(function(){
//      remote.unchoke();
//      remote.interested();
//      remote.notInterested();
//      remote.have(10);
//      var bitfield = new Bitfield(128);
//      bitfield.set(5);
//      remote.bitfield(bitfield);
//      remote.request(0,1,2);
//      remote.cancel(0,1,2);
//      remote.piece(0,1,crypto.randomBytes(5));
//      remote.port(6881);
      
      remote.close();
    
      server.stop();

      // dunno why server isn't closing
      server.server.unref();
    });
    
    
  });
 
});

