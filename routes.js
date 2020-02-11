'use strict';

const deptree = require('./deptree');

module.exports = {

  // Register all REST api routes.
  //
  registerAPIRoutes: function(server) {

    // Retrieve the direct dependencies of a package
    //
    server.route({
      method: 'GET',
      path: '/api/v1/deps/{pck}/{ver?}',
      handler: async(request, h) => {
        var pck = request.params.pck;
        var ver = request.params.ver;

        setTimeout(function() {

          // Kick off a background collection

          deptree.dependencies(pck).catch(err => {
            console.log('Background dependency collection failed:', err);
          });
        }, 1000);

        try {
          return await deptree.dependency(pck, ver);
        } catch (e) {

          // FIXME: Crude error handling - should have
          // different error codes and better error description

          return h.response(String(e)).code(400);
        }
      },
    });

    // Retrieve the direct and indirect (dependencies of dependencies)
    // of a package
    //
    server.route({
      method: 'GET',
      path: '/api/v1/alldeps/{pck}/{ver?}',
      handler: async(request, h) => {
        var pck = request.params.pck;
        var ver = request.params.ver;

        try {
          return await deptree.dependencies(pck, ver);
        } catch (e) {

          // FIXME: Crude error handling - should have
          // different error codes and better error description

          return h.response(String(e)).code(400);
        }
      },
    });
  },
};
