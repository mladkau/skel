NodeJS Dependency Search
========================

NodeJS Dependency Search (NDS) is a demo web service application that, given a name of an npm published package, returns the
set of dependencies for said package. The dependencies are presented in a tree view.


Installation / Operation
------------------------
NDS can be build from its root directory with:
```
npm install
```

The unit tests can be run with:
```
npm test
```

The server can be started with:
```
node index.js
```
The UI should be accessible under: http://localhost:8000/


Code organization
-----------------
The JavaScript code is organizaed in 3 files in the backend and 3 files in the frontend.

Backend:

- index.js - Main entry point. This file creates and runs the webserver and registers the main routes.

- routes.js - Contains the servlet code which handles HTTP requests. The request handlers talk to the
              low-level API in deptree.js.

- deptree.js - Main API code which communicates with registry.npmjs.org and collects the dependency data.
               It uses a simple memory cache to avoid requesting the same information multiple times.
               The code is tested with unit tests.

Frontend:

- web/js/derevo.js - A tree-visualization library.

- web/js/common.js - Common front-end code e.g. lookup of DOM elements.

- web/js/main.js - Main code which initialises and operates the tree visualization and processes user input.


Shortcomings
------------
- The version information currently ignores the modifiers which allow newer patch level (~) or newer patch level or minor version (^).
- The version information does not support versions with placeholders (e.g. 1.x.x) - the current code assumes '0' (e.g. 1.0.0).
- A package which is dependent on another package in different versions is not supported in the moment. An arbitrary version is chosen in this case.
- The error handling is not very detailed.
