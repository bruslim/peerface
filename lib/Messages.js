/*jshint node: true */

'use strict';

module.exports = {
  Base          : require('./dto/TcpMessage'),
  Handshake     : require('./dto/Handshake'),
  KeepAlive     : require('./dto/KeepAlive'),
  Peer          : require('./dto/PeerMessage'),
  Choke         : require('./dto/ChokeMessage'),
  Unchoke       : require('./dto/UnchokeMessage'),
  Interested    : require('./dto/InterestedMessage'),
  NotInterested : require('./dto/NotInterestedMessage'),
  Have          : require('./dto/HaveMessage'),
  Bitfield      : require('./dto/BitfieldMessage'),
  Request       : require('./dto/RequestMessage'),
  Piece         : require('./dto/PieceMessage'),
  Cancel        : require('./dto/CancelMessage'),
  Port          : require('./dto/PortMessage')
};