/*jshint node: true */

'use strict';

var events = require('events');

var crypto = require('crypto');

var test = require('tape');

var Bitfield = require('bitfield');

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

test('route data test', function(t) {
  var mockSocket = new events.EventEmitter();
  var peer = new lib.PeerConnection(mockSocket);
  
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
  
  t.test("all the messages", function(t) {
    peer.on('keep-alive', function(e) {
      t.deepEqual(messages.keepAlive, e.toBuffer(), "keep-alive should be the same");
    });
    peer.on('choke', function(e) {
      t.deepEqual(messages.choke, e.toBuffer(), "choke should be the same");
    });
    peer.on('unchoke', function(e) {
      t.deepEqual(messages.unchoke, e.toBuffer(), "unchoke should be the same");
    });
    peer.on('interested', function(e) {
      t.deepEqual(messages.interested, e.toBuffer(), "interested should be the same");
    });
    peer.on('not-interested', function(e) {
      t.deepEqual(messages.notInterested, e.toBuffer(), "not-interested should be the same");
    });
    peer.on('have', function(e) {
      t.deepEqual(messages.have, e.toBuffer(), "have should be the same");
    });
    peer.on('bitfield', function(e) {
      t.deepEqual(messages.bitfield, e.toBuffer(), "bitfield should be the same");
    });
    peer.on('request', function(e) {
      t.deepEqual(messages.request, e.toBuffer(), "request should be the same");
    });
    peer.on('piece', function(e) {
      t.deepEqual(messages.piece, e.toBuffer(), "piece should be the same");
    });
    peer.on('cancel', function(e) {
      t.deepEqual(messages.cancel, e.toBuffer(), "cancel should be the same");
    });  
    peer.on('port', function(e) {
      t.deepEqual(messages.port, e.toBuffer(), "port should be the same");
    });

    var keys = Object.keys(messages);
    var bytes = Buffer.concat(keys.map(function(key){ return messages[key]; }));
    
    t.plan(keys.length+1);
    
    t.equal(peer.routeData(bytes).length, keys.length, "should have " + keys.length + " messages");
    
    // clear the deathTimer since this seems to hang tape
    clearTimeout(peer._deathTimer);
  });
  
  t.end();
});