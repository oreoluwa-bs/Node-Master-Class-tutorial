/**
 * Frontend logic for the application
 * 
 */

// Container for frontend application
const app = {};

// Config
app.config = {
    'sessionToken': false,
};

// AJAX client for restful api
app.client = {};

// Interface for making api calls
app.client.request = function (headers, path, method, queryStringObject, payload, callback) {

    // Set defaults
    headers = typeof (headers) == 'object' && headers !== null ? headers : {};
    path = typeof (path) == 'string' ? path : '';
    method = typeof (method) == 'string' && ['POST', 'GET', 'PUT', 'DELETE'].indexOf(method) > -1 ? method.toUpperCase() : 'GET';
    queryStringObject = typeof (queryStringObject) == 'object' && queryStringObject !== null ? queryStringObject : {};
    payload = typeof (payload) == 'object' && payload !== null ? payload : {};
    callback = typeof (callback) == 'function' ? callback : false;

    // For each querystring parameter sent add to path
    let requestUrl = path + '?';
    let counter = 0;
    for (const queryKey in queryStringObject) {
        if (queryStringObject.hasOwnProperty(queryKey)) {
            counter++;

            // if at least one query string parameter has already been added, prepend  new ones with an appersand
            if (counter > 1) {
                requestUrl += '&';
            }

            // Add the key and value
            requestUrl += queryKey + '=' + queryStringObject[queryKey];
        }
    }

    // Form the http request as a json type
    const xhr = new XMLHttpRequest();
    xhr.open(method, requestUrl, true);
    xhr.setRequestHeader("Content-Type", "application/json");

    // For each header the user might have sent, add it to the request
    for (const headerKey in headers) {
        if (headers.hasOwnProperty(headerKey)) {
            xhr.setRequestHeader(headerKey, headers[headerKey]);
        }
    }

    // If there is a current session token, add that as a header
    if (app.config.sessionToken) {
        xhr.setRequestHeader("token", app.config.sessionToken.id);
    }

    // When the request comes back, handle the response
    xhr.onreadystatechange = function() {
        if(xhr.readyState = XMLHttpRequest.DONE){
            const statusCode = xhr.status;
            const responseReturned = xhr.responseText;

            // Callback if requested
            if(callback){
                try{
                    const parsedResponse = JSON.parse(responseReturned);
                    callback(statusCode,parsedResponse);
                }catch(e){
                    callback(statusCode,false);
                }
            }
        }
    }

    // Send the payload as string
    const payloadString = JSON.stringify(payload);
    xhr.send(payloadString);
}