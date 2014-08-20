Peerface
===========

Evented, peer communication module for BitTorrent.

All events return a `Message` object which contains properties named according to the spec.

To install:

~~~~~~~~~
npm install peerface
~~~~~~~~~

[![Code Climate](https://codeclimate.com/github/bruslim/peerface/badges/gpa.svg)](https://codeclimate.com/github/bruslim/peerface)
[![Test Coverage](https://codeclimate.com/github/bruslim/peerface/badges/coverage.svg)](https://codeclimate.com/github/bruslim/peerface)

## Usage

~~~~~~~~~~ js

// import
var Peerface = require('peerface');

// create the server, and listen for incoming messages
var server = Peerface.listen(6881);

// connect to a peer
var peer = Peerface.connect(ipAddress, port);

// listen for a peer
server.on('peer-connected', function(peer){
  
  // listen for protocol messages from peer
  peer.on('handshake', function(msg){ ... });
  peer.on('keep-alive', function(msg){ ... });
  peer.on('choke', function(msg){ ... });
  peer.on('unchoke', function(msg){ ... });
  peer.on('interested', function(msg){ ... });
  peer.on('not-interested', function(msg){ ... });
  peer.on('have', function(msg){ ... });
  peer.on('bitfield', function(msg){ ... });
  peer.on('request', function(msg){ ... });
  peer.on('piece', function(msg){ ... });
  peer.on('cancel', function(msg){ ... });
  peer.on('port', function(msg){ ... });
  
  // listen for socket events
  peer.on('close', function(hadError) { ... });
  peer.on('error', function(err) { ... });
  
  // send protocol messages to peer
  peer.handshake(peerId, infoHash); // infohash buffer or base64 string
  peer.keepAlive();
  peer.choke();
  peer.unchoke();
  peer.interested();
  peer.notInterested();
  peer.have(pieceIndex);
  peer.bitfield(bitfield); // use node-bitfield
  peer.request(index, begin, length);
  peer.piece(index, begin, bytes); // bytes is a buffer
  peer.cancel(index, begin, length);
  peer.port(listenPort);
  
});

// listen for server errors
server.on('error', function(err) { ... });

// listen for server stopping
server.on('stopping', function(date) { ... });

// listen for server stop
server.on('stop', function(hadError) { ... });

~~~~~~~~~~


## License

~~~~~~~~~~~

The MIT License (MIT)

Copyright (c) 2014 Brian Ruslim

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.

~~~~~~~~~~~

## Thanks

Made @ [HackerSchool (S'14 June)](https://www.hackerschool.com)

Also thanks to [Carlos](https://github.com/carletex) for pairing with me
and helping me debug this library.
