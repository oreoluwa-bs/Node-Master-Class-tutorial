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
const util = require('util');
const debug = util.debuglog('server');

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
        let chosenHandler = typeof (server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handlers.notFound

        // If the request is within the public directory, use the public handler instead
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handlers.public : chosenHandler;

        // Construct the data object to send to the handler
        const data = {
            'trimmedPath': trimmedPath,
            'queryStringObject': queryStringObject,
            'method': method,
            'headers': headers,
            'payload': helpers.parseJsonToObject(buffer)
        };

        // Route the request specified in the router
        chosenHandler(data, function (statusCode, payload, contentType) {
            // Use the status code called back by the handler or default to an number
            statusCode = typeof (statusCode) == 'number' ? statusCode : 200;

            // Determine the type of respons default json
            contentType = typeof (contentType) == 'string' ? contentType : 'json'

            // Return response parts that are cintent specific
            let payloadString = '';
            if (contentType == 'json') {
                res.setHeader('Content-Type', 'application/json');
                // Use the payload called back by the handler or default to an empty object
                payload = typeof (payload) == 'object' ? payload : {};
                // Convert the payload to a string
                payloadString = JSON.stringify(payload);
            }
            if (contentType == 'html') {
                res.setHeader('Content-Type', 'text/html');
                payloadString = typeof (payload) == 'string' ? payload : '';
            }
            if (contentType == 'favicon') {
                res.setHeader('Content-Type', 'image/x-icon');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'css') {
                res.setHeader('Content-Type', 'text/css');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'png') {
                res.setHeader('Content-Type', 'image/png');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'jpg') {
                res.setHeader('Content-Type', 'image/jpg');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }
            if (contentType == 'plain') {
                res.setHeader('Content-Type', 'text/plain');
                payloadString = typeof (payload) !== 'undefined' ? payload : '';
            }

            // Return the response parts that are common to all content-types
            res.writeHead(statusCode);
            // Send the response
            res.end(payloadString);


            // Log the request path, if the response is 200 print  green otherwise print red
            // console.log(`Request is received on path: ${trimmedPath} with this ${method} with this query string parameters`, queryStringObject);
            // console.log(`Request is received with these headers: `, headers);
            // console.log(`Request is received with this payload: `, buffer);
            // debug('Returning this response: ', statusCode, payloadString);

            if (statusCode == 200) {
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            } else {
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + ' /' + trimmedPath + ' ' + statusCode);
            }
        });

    });
};


// Define request router
server.router = {
    '': handlers.index,
    'account/create': handlers.accountCreate,
    'account/edit': handlers.accountEdit,
    'account/deleted': handlers.accountDeleted,
    'session/create': handlers.sessionCreate,
    'session/deleted': handlers.sessionDeleted,
    'checks/all': handlers.checksList,
    'checks/create': handlers.checksCreate,
    'checks/edit': handlers.checksEdit,
    'ping': handlers.ping,
    'api/users': handlers.users,
    'api/tokens': handlers.tokens,
    'api/checks': handlers.checks,
    'favicon.ico': handlers.favicon,
    'public': handlers.public
}

// init server
server.init = function () {
    // Start the http server
    server.httpServer.listen(config.httpPort, function () {
        console.log('\x1b[36m%s\x1b[0m', 'The server is listening on port ' + config.httpPort + ' now');
    });

    // Start the https server
    server.httpsServer.listen(config.httpsPort, function () {
        console.log('\x1b[35m%s\x1b[0m', 'The server is listening on port ' + config.httpsPort + ' now');
    });
}

module.exports = server