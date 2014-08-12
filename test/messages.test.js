/*jshint node: true */

'use strict';

var crypto = require('crypto');

var test = require('tape');

var Bitfield = require('bitfield');

var lib = require('../index');

test('handshake dto test', function(t){
  var infoHash, peerId;
  peerId = crypto.randomBytes(10).toString('hex');
  var pstrlen = new Buffer(1);
  pstrlen.writeUInt8(19,0);
  var bytes = Buffer.concat([
    // pstrlen
    pstrlen,
    // pstr
    new Buffer('BitTorrent protocol'),
    // reserved
    new Buffer([0,0,0,0,0,0,0,0]),
    // info hash
    (infoHash = crypto.randomBytes(20)),
    // peer_id
    new Buffer(peerId)
  ]);

  console.log(new Buffer(peerId).length, bytes.length, 19+49);
  var msg = new lib.Messages.Handshake(bytes);
  
  t.equal(msg.pstrlen, 19, 'pstrlen should be 19');
  t.equal(msg.pstr, 'BitTorrent protocol', "pstr should be 'BitTorrent protocol'");
  t.deepEqual(msg._infoHash, infoHash, "info_hashes should match");
  t.equal(msg.peerId, peerId, "peer_ids should match");
  t.deepEqual(msg.toBuffer(),bytes, "buffers should match");
  t.end();
  
});

test('keep-alive dto test', function(t) {
  var bytes = new Buffer([0,0,0,0]);
  var msg = new lib.Messages.KeepAlive(bytes);
  
  t.equal(msg.len, 0, 'message len should be 0');
  
  t.end();
});

test('choke dto test', function(t) {
  var bytes = new Buffer([0,0,0,1,0]);
  var msg = new lib.Messages.Choke(bytes);
  
  t.equal(msg.len, 1, 'message len should be 1');
  t.equal(msg.id, 0, 'message id should be 0');
  
  t.end();
});

test('unchoke dto test', function(t) {
  var bytes = new Buffer([0,0,0,1,1]);
  var msg = new lib.Messages.Unchoke(bytes);

  t.equal(msg.len, 1, 'message len should be 1');
  t.equal(msg.id, 1, 'message id should be 1');
  
  t.end();
});

test('interested dto test', function(t) {
  var bytes = new Buffer([0,0,0,1,2]);
  var msg = new lib.Messages.Interested(bytes);

  t.equal(msg.len, 1, 'message len should be 1');
  t.equal(msg.id, 2, 'message id should be 2');
  
  t.end();
});

test('not-interested dto test', function(t) {
  var bytes = new Buffer([0,0,0,1,3]);
  var msg = new lib.Messages.NotInterested(bytes);

  t.equal(msg.len, 1, 'message len should be 1');
  t.equal(msg.id, 3, 'message id should be 3');
  
  t.end();
});

test('have dto test', function(t) {
  var bytes = new Buffer([0,0,0,5,4,0,0,0,1]);
  var msg = new lib.Messages.Have(bytes);
  
  t.equal(msg.len, 5, 'message len should be 1');
  t.equal(msg.id, 4, 'message id should be 4');
  t.equal(msg.pieceIndex, 1, 'message piece index should be 1');
  
  t.end();
});

test('bitfield dto test', function(t) {
  var bitfield = new Bitfield(256);
  bitfield.set(128);
  
  var length = bitfield.buffer.length+1;
  
  var len = new Buffer(4);
  len.writeInt32BE(length,0);
  
  var bytes = Buffer.concat([
    len,
    new Buffer([5]),
    bitfield.buffer
  ]);

  var msg = new lib.Messages.Bitfield(bytes);
  
  t.equal(msg.len, length, 'message len should be ' + length);
  t.equal(msg.id, 5, 'message id should be 5');
  t.deepEquals(msg.bitfield, bitfield, 'bitfields should match');
  
  t.end();
});

test('request dto test', function(t) {
  var bytes = new Buffer([
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
  
  t.end();
});

test('piece dto test', function(t){
  var block = crypto.randomBytes(4);
  
  var bytes = Buffer.concat([
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
  
  t.end();
});

test('cancel dto test', function(t){
  var bytes = new Buffer([
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
  
  t.end();
});

test('port dto test', function(t){
  var bytes = new Buffer([
    0,0,0,3,
    9,
    0,10
  ]);
  
  var msg = new lib.Messages.Port(bytes);
  
  t.equal(msg.len, 3, 'message len should be 1');
  t.equal(msg.id, 9, 'message id should be 8');
  t.equal(msg.listenPort, 10, 'message listenPort should be 10');

  t.end();
});