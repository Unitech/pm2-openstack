

var EventEmitter = require('events').EventEmitter;
var request      = require('request');
var channel      = new EventEmitter();

//channel.emit('ready')
//channel.on('ready', function(){})
var OpenStack = {
  init : function(opts, cb) {
  },
  createNewVm : function(opts, cb) {
  }
};

module.exports = OpenStack;
