'use strict';

if (process.argv.length < 3) {
    console.log('Usage: $ node server.js <port1> <port2> <port3>');
    console.log('Example: $ node server.js 9001 9002 9003');
    console.log('Exit');

    process.exit();
}

var WebSocketServer = require('ws').Server;

process.argv.forEach(function (val, index) {
   if (index > 1) {
       var wss = new WebSocketServer({port: val}, function () {
           console.log('WebSocketServer :: listening on port ' + val);
       });

       wss.on('connection', function (ws) {
           console.log('WebSocket[' + val + '] :: connected');

           ws.on('message', function (msg) {
               console.log('WebSocket[' + val + '] :: ' + msg);

               ws.send (msg);
           });
       });
   }
});