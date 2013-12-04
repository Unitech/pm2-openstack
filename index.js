
//L isten to pm2 urls
// Look if there is to much load


var each         = require('each');
var request      = require('request');
var debug        = require('debug')('pm2-openstack');
var nginx        = require('./nginx');
var orchestrator = require('./orchestrator');
var openstack    = require('./interactions/openstack');

// pop de vm
// une fois ready
// -> ajout du monitoring pm2
// -> ajout de l'ip dans nginx
//
// -> benchmark
// ->

var hosts_up = ['http://localhost:9615'];

var orchester_events = orchestrator.init();

var hostManager = {
  hosts : [],
  push : function(host, cb) {
    var self = this;
    self.hosts.push(host);
    orchestrator.addPm2Node(host + ':9615');
    nginx.addServer(host, cb);
  },
  pop : function(host, cb) {
    var self = this;
    if (self.hosts.length == 1) return;
    self.hosts.pop();
    orchestrator.removePm2Node(host + ':9615');
    nginx.removeServer(host, cb);
  }
};


function manage() {
  orchester_events
    .on('scale:up', function() {
      debug('Scale up (%d servers)', hostManager.hosts.length);
      hostManager.push('http://localhost', function() {
        debug('Successfully Scaled up (%d servers)', hostManager.hosts.length);
      });
    })
    .on('scale:down', function() {
      debug('Scale up (%d servers)', hostManager.hosts.length);
      hostManager.pop('http://localhost', function() {
        debug('Successfully Scaled down (%d servers)', hostManager.hosts.length);
      });
    });
}


(function() {
  nginx.init({
    file : 'nginx-confs/nginx-bckp.conf'
  }, function() {
    hostManager.push('http://localhost', function() {
      manage();
    });
  });
})();

// nginx.addServer('192.123.23.21', function(err) {
//   // console.log(err);
//   nginx.removeServer('192.123.23.22', function() {
//     // console.log('end');
//     //  nginx.reload(function(err, dt) {
//     //    console.log(arguments);
//     //  });
//   });
// });


// orchestrator.addPm2Node({
//   url : 'http://localhost:9615',
//   current_load : 0,
//   loadavg : []
// });

// console.log(orchestrator.pm2_endpoints);
