
//L isten to pm2 urls
// Look if there is to much load


var each         = require('each');
var request      = require('request');
var debug        = require('debug')('pm2-openstack');
var nginx        = require('./nginx');
var orchestrator = require('./orchestrator');
var openstack    = require('./interactions/openstack');

var orchester_events = orchestrator.init({
  hosts : [{
    url : 'http://localhost:9615',
    current_load : 0,
    loadavg : []
  },{
    url : 'http://localhost:9615',
    current_load : 0,
    loadavg : []
  }]
});

orchester_events
  .on('scale:up', function() {
    debug('Scale up');
  })
  .on('scale:down', function() {
    debug('Scale down');
  });


// orchestrator.addPm2Node({
//   url : 'http://localhost:9615',
//   current_load : 0,
//   loadavg : []
// });

// console.log(orchestrator.pm2_endpoints);





// nginx.init({
//   file : 'nginx-confs/nginx-bckp.conf'
// }, function() {
//   nginx.addServer('192.123.23.21', function(err) {
//     // console.log(err);
//     nginx.removeServer('192.123.23.22', function() {
//       // console.log('end');
//       //  nginx.reload(function(err, dt) {
//       //    console.log(arguments);
//       //  });
//     });
//   });
// });
