/**
 * Server Related tasks
 * 
 */
// Dependencies
const http = require('http');
const https = require('https');
const url = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const config = require('./config');
const fs = require('fs');
const handlers = require('./handlers');
const helpers = require('./helpers');
const path = require('path');

// Instatiate te server module object
const server = {};

// Intatiating the http Server
server.httpServer = http.createServer(function (req, res) {
    server.unifiedServer(req, res);
});

// Instantiate the https server
server.httpsServerOptions = {
    'key': fs.readFileSync(path.join(__dirname, '/../https/key.pem')),
    'cert': fs.readFileSync(path.join(__dirname, '/../https/cert.pem'))
};
server.httpsServer = https.createServer(server.httpsServerOptions, function (req, res) {
    server.unifiedServer(req, res);
});



// All server logic for both http and https
server.unifiedServer = function (req, res) {
    // Get URL and parse it
    const parsedUrl = url.parse(req.url, true);

    // Get the path
    const path = parsedUrl.pathname;
    const trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the query string as an object
    const queryStringObject = parsedUrl.query;

    // Get the HTTP method
    var method = req.method.toLowerCase();

    // Get the query string as an object
    const headers = req.headers;

    // Get the payload, if any
    const decoder = new StringDecoder('utf-8');
    let buffer = '';
    req.on('data', function (data) {
        buffer += decoder.write(data);
    });
    req.on('end', function () {
        buffer += decoder.end();

        // choose handler where request goes to, if not found go to notfound handler
        var chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound

        // Construct the data object to send to the handler
        var data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request specified in the router
        chosenHandler(data, function (statusCode, payload) {
            // Use the status code called back by the handler or default to an number
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            // Use the payload called back by the handler or default to an empty object
            payload = typeof (payload) == 'object' ? payload : {};

            // Convert the payload to a string
            var payloadString = JSON.stringify(payload);

            // Return response
            res.setHeader('Content-Type', 'application/json');
            res.writeHead(statusCode);
            // Send the response
            res.end(payloadString);


            // Log the request path;
            // console.log(`Request is received on path: ${trimmedPath} with this ${method} with this query string parameters`, queryStringObject);
            // console.log(`Request is received with these headers: `, headers);
            // console.log(`Request is received with this payload: `, buffer);

            console.log('Returning this response: ', statusCode, payloadString);
        });

    });
};


// Define request router
server.router = {
    'ping': handlers.ping,
    'users': handlers.users,
    'tokens': handlers.tokens,
    'checks': handlers.checks
}

// init server
server.init = function () {
    // Start the http server
    server.httpServer.listen(config.httpPort, function () {
        console.log('The server is listening on port ' + config.httpPort + ' now');
    });

    // Start the https server
    server.httpsServer.listen(config.httpsPort, function () {
        console.log('The server is listening on port ' + config.httpsPort + ' now');
    });
}

module.exports = server