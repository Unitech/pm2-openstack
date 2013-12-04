
/**
 * @file Manipulate nginx programaticcaly
 * @author Alexandre Strzelewicz <as@unitech.io>
 * @project pm2-openstack
 */

var NginxConfFile = require('nginx-conf').NginxConfFile;
var exec          = require('child_process').exec;
var util          = require('util');

var Nginx = {
  /**
   * Initialize this singleton to manipulate nginx
   * @param {object} opts options (file)
   */
  init : function(opts, cb) {
    var self = this;
    this.file = opts.file;

    NginxConfFile.create(self.file, function(err, conf) {
      if (err)
        throw new Error(err);
      self.conf = conf;
      setTimeout(cb, 500);
    });
  },
  /**
   * Add a server host in the first upstream found
   * @param {string} host hostname/ip
   */
  addServer : function(host, cb) {
    var serverDb = this.conf.nginx.http.upstream;

    if (serverDb.server && util.isArray(serverDb.server)) {
      serverDb.server.forEach(function(server, i) {
        var tmp = server.toString().replace(/\n/g, '');
        var splitted = tmp.split(' ');
        var hostname = splitted[1].replace(/;/g, '');

        if (hostname == host) {
          return cb({msg:'already added'});
        }
      });
    }
    else if (serverDb.server) {
      var tmp = serverDb.server.toString().replace(/\n/g, '');
      var splitted = tmp.split(' ');
      var hostname = splitted[1].replace(/;/g, '');

      if (hostname == host)
        return cb({msg:'already added'});
    }

    this.conf.nginx.http.upstream._add('server', host);
    this.conf.flush(cb);
  },
  /**
   * Remove the specified host
   * @param {string} host hostname/ip
   */
  removeServer : function(host, cb) {
    var serverDb = this.conf.nginx.http.upstream;
    var self = this;

    if (serverDb.server && !util.isArray(serverDb.server))
      return;

    serverDb.server.forEach(function(server, i) {
      (function(server) {
        var tmp = server.toString().replace(/\n/g, '');
        var splitted = tmp.split(' ');
        var hostname = splitted[1].replace(/;/g, '');

        if (hostname == host) {
          serverDb._remove('server', i);
        }
      })(server);
    });
    this.conf.flush(cb);
  },
  /**
   * Simple nginx reload
   */
  reload : function(cb) {
    exec('nginx -s reload', cb);
  },
  getConf : function() {
    return this.conf.nginx;
  },
  listServers : function() {
    var servers = [];

    this.conf.nginx.http.upstream.server.forEach(function(server) {
      var tmp = server.toString().replace(/\n/g, '');
      var splitted = tmp.split(' ');
      servers.push({
        raw : tmp,
        host : splitted[1],
        options : splitted.slice(2, splitted.length).toString().replace(/,/g, ' ')
      });
    });
    return servers;
  }
};

module.exports = Nginx;
