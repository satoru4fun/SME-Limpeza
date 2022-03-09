const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const http = require('http');
const app = require('./api/routes');
const server = http.createServer(app);
server.setTimeout(120000);

const port = process.env.SERVER_PORT || 3001;

console.log(`Listen on port ${port}... `);
server.listen(port);