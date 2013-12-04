
var debug   = require('debug')('orchestaror');
var request = require('request');
var each = require('each');

var EventEmitter = require('events').EventEmitter;
var channel      = new EventEmitter();

var t;

/**
 * Global load of the infrastructure
 */
const TRIGGER_VM_LOADAVG = 1.5;
const DOWN_SCALE_LOADAVG = 0.6;
const RELAUNCH_AFTER_POP = 10;  // seconds
const REFRESH_TIME       = 1; //secs

var Orchestrator = {
  init : function(opts) {
    this.infra_load = {
      loadavg : 0
    };
    this.pm2_endpoints = [];

    this.worker();
    this.channel = new EventEmitter();
    return this.channel;
  },
  addPm2Node : function(url) {
    this.pm2_endpoints.push({
      url : url,
      current_load : 0,
      loadavg : []
    });
  },
  removePm2Node : function(url) {
    var self = this;

    this.pm2_endpoints.forEach(function(ep, i) {
      if (ep.url == url)
        return self.pm2_endpoints.splice(i, 1);
    });
  },
  worker : function() {
    var self = this;

    t = setInterval(function() {
      // Grab all data from all pm2 endpoints
      self.pm2Refresh(function() {
        // Get mean of the infra load
        self.calculateInfraLoad(self.pm2_endpoints);

        debug('Average load = %d', self.infra_load.loadavg);

        if (self.infra_load.loadavg < DOWN_SCALE_LOADAVG) {
          debug('Unpop of VM');

          self.channel.emit('scale:down');
          clearInterval(t);
          setTimeout(function() {
            Orchestrator.worker();
          }, RELAUNCH_AFTER_POP * 1000);
        }

        if (self.infra_load.loadavg > TRIGGER_VM_LOADAVG) {
          debug('Trigger pop of a new VM');

          // Append new instance to pm2_endpoints
          self.channel.emit('scale:up');
          clearInterval(t);
          setTimeout(function() {
            Orchestrator.worker();
          }, RELAUNCH_AFTER_POP * 1000);
        }
      });
    }, REFRESH_TIME * 1000);
  },
  calculateInfraLoad : function() {
    var self = this;
    var lastLoad = 0;

    self.pm2_endpoints.forEach(function(pm2) {
      lastLoad += pm2.loadavg[0];
    });
    self.infra_load.loadavg = lastLoad / self.pm2_endpoints.length;
  },
  calculateLoad : function(processes) {
    var ret = 0;
    processes.forEach(function(proc) {
      ret += proc.monit.cpu;
    });
    // Remove 1 because there is the web interface
    return ret / (processes.length - 1);
  },
  /**
   * Iterate over all pm2 instances and make a mean of the loadavg
   */
  pm2Refresh : function(cb) {
    var self = this;
    each(self.pm2_endpoints)
      .on('item', function(el, i, next) {
        request(el.url, function(err, res, body) {
          if (err) next(err);
          var monit_data = JSON.parse(body);
          var current_load = self.calculateLoad(monit_data.processes);

          el.currentLoad = current_load;
          el.loadavg = monit_data.monit.loadavg;
          return next();
        });
      })
      .on('error', function(err) {
        throw err;
      })
      .on('end', function() {
        return cb();
      });
  }
};

module.exports = Orchestrator;
