'use strict';

const Hapi = require('hapi');
const deptree = require('./deptree');
const routes = require('./routes');
const path = require('path');

// Create a server with a host and port

const server = Hapi.server({
  host: 'localhost',
  port: 8000,
  routes: {
    files: {
      relativeTo: path.join(__dirname, 'web'),
    },
  },
});

// Add the routes

routes.registerAPIRoutes(server);

// Optional: Enable debugging
// deptree.logger(console.log);

// Start the server

const startServer = async function() {
  await server.register(require('inert'));

  // Register file serving handler

  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: '.',
        redirectToSlash: true,
        index: true,
      },
    },
  });

  await server.start();
  console.log('Server running at:', server.info.uri);
};

startServer().catch(err => {

  // Error handling

  console.log(err);
  process.exit(1);
});
