'use strict';

// n8n loads the files declared under package.json#n8n, not this entry point.
// It stays as `main` so `require('n8n-nodes-truslay')` exposes the same exports.
module.exports = require('./dist/index.js');
