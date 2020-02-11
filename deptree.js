'use strict';

const NodeCache = require('node-cache');
const NodeCacheConf = {
  stdTTL: 60 * 60 * 24, // Standard ttl for each item as number in seconds
  checkperiod: 120, // Interval in seconds for automatic deletion
};
const req = require('request');
const u = require('util');

var log = function() {}; // Debug logging

// Local cache for known dependencies

var cache = new NodeCache(NodeCacheConf);

// API
// ===

module.exports = {

  // Lookup all dependencies of a single package.
  //
  // Resolve returns: Object hierachy mapping dependency to required version
  // Reject returns:  Human-readable error message
  //
  dependencies: function(pkg, ver) {

    return new Promise((resolve, reject) => {

      // Get initial

      module.exports.dependency(pkg, ver).then(deps => {
        resolve({
          "bounce":	"1.0.0",
          "call":	"5.0.0",
          "catbox":	"10.0.0",
        });

      }).catch(err => { reject(err); });
    });
  },

  // Lookup all direct dependencies of a single package.
  //
  // Resolve returns: Object mapping dependency to required version
  // Reject returns:  Human-readable error message
  //
  dependency: function(pkg, ver) {

    if (!ver) {
      ver = 'latest';
    }

    log('Request for dependencies of', pkg, ' (' + ver + ')');

    return new Promise((resolve, reject) => {
      resolve({
        "bounce":	"1.0.0",
        "call":	"5.0.0",
        "catbox":	"10.0.0"
      });
    });
  }
}
