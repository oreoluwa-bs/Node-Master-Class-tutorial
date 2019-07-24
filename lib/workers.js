/**
 * These are worker relsted tasks
 * 
 */

// Dependencies
const path = require('path');
const fs = require('fs');
const _data = require('./data');
const http = require('http');
const https = require('https');
const helpers = require('./helpers');
const url = require('url');

//Instantiate worker object
const workers = {};

workers.init = function () {
    // Execute all checks immediatly
    workers.gatherAllChecks();

    // call a loop so checks execute on their own
    workers.loop();
}

// Timer to execute the worker-process once per minute
workers.loop = function () {
    setInterval(function () {
        workers.gatherAllChecks();

    }, 1000 * 60)
}

// Look up all checks, get their data, send to a validator
workers.gatherAllChecks = function () {
    // Get all the checks that exists 
    _data.list('checks', function (err, checks) {
        if (!err && checks && checks.length > 0) {
            checks.forEach(check => {
                // Read in the check data
                _data.read('checks', check, function (err, originalCheckData) {
                    if (!err && originalCheckData) {
                        // Pass it to the check validator, and let that function continue or log errors as needed
                        workers.validateCheckData(originalCheckData);
                    } else {
                        console.log('Error reading one of the check\'s data')
                    }
                });
            });
        } else {
            console.log('Error: Could not find any checks to process')
        }
    });
};

// Sanity checking the check data
workers.validateCheckData = function (originalCheckData) {
    originalCheckData = typeof (originalCheckData) == 'object' && originalCheckData !== null ? originalCheckData : {};
    originalCheckData.id = typeof (originalCheckData.id) == 'string' && originalCheckData.id.trim().length == 20 ? originalCheckData.id.trim() : false;
    originalCheckData.userPhone = typeof (originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length == 10 ? originalCheckData.userPhone : false;
    originalCheckData.protocol = typeof (originalCheckData.protocol) == 'string' && ['http', 'https'].indexOf(originalCheckData.protocol) > -1 ? originalCheckData.protocol : false;
    originalCheckData.url = typeof (originalCheckData.url) == 'string' && originalCheckData.url.trim().length > 0 ? originalCheckData.url.trim() : false;
    originalCheckData.method = typeof (originalCheckData.method) == 'string' && ['post', 'get', 'put', 'delete'].indexOf(originalCheckData.method) > -1 ? originalCheckData.method.trim() : false;
    originalCheckData.successCodes = typeof (originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length > 0 ? originalCheckData.successCodes : [];
    originalCheckData.timeoutSeconds = typeof (originalCheckData.timeoutSeconds) == 'number' && originalCheckData.timeoutSeconds % 1 === 0 && originalCheckData.timeoutSeconds >= 1 && originalCheckData.timeoutSeconds <= 5 ? originalCheckData.timeoutSeconds : false;

    // Set the keys that may not be set if the workers have never seen  this check before
    originalCheckData.state = typeof (originalCheckData.state) == 'string' && ['up', 'down'].indexOf(originalCheckData.state) > -1 ? originalCheckData.state : 'down';
    originalCheckData.lastChecked = typeof (originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked > 0 ? originalCheckData.lastChecked : false;

    // If all the checks pass pass the data allong to the next step in the process
    if (originalCheckData.id && originalCheckData.protocol && originalCheckData.userPhone && 
        originalCheckData.url && originalCheckData.method &&
        originalCheckData.successCodes && originalCheckData.timeoutSeconds) {
        workers.performCheck(originalCheckData);
    } else {
        console.log("Error in one of the checks is not properly formatted. Skipping it");
    }
}

// Perform the check, send the originalCheckData and outcome of the check protocol
workers.performCheck = function (originalCheckData) {
    // Prepare the inital check outcome
    let checkOutcome = {
        'error': false,
        'responseCode': false,
    };

    // Mark that the outcome has not been sent yet
    let outcomeSent = false;

    // Parse th hostname and path out of the original check data
    const parsedUrl = url.parse(originalCheckData.protocol + '://' + originalCheckData.url, true);
    const hostName = parsedUrl.hostname;
    const path = parsedUrl.path; // Using path and not pathname to the query string

    // Construct the request
    const requestDetails = {
        'protocol': originalCheckData.protocol + ':',
        'hostname': hostName,
        'method': originalCheckData.method.toUpperCase(),
        'path': path,
        'timeout': originalCheckData.timeoutSeconds * 1000
    };

    // Instanitate the request object using http or https module
    const _moduleToUse = originalCheckData.protocol == 'http' ? http : https;
    const req = _moduleToUse.request(requestDetails, function (res) {
        // Grab the status of the sent request
        const status = res.statusCode;

        // Update the checkoutcome and pass the data along
        checkOutcome.responseCode = status;

        if (!checkOutcome) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }

    });

    // Bind to the error so it doesnt get thrown
    req.on('error', function (err) {
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': err
        };

        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // Bind to the timeout event
    req.on('timeout', function (err) {
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            'error': true,
            'value': 'timeout'
        };

        if (!outcomeSent) {
            workers.processCheckOutcome(originalCheckData, checkOutcome);
            outcomeSent = true;
        }
    });

    // End the request
    req.end();
};

// Process the check outcome and update the check data as needed and trigger an alert as needed
// Special logic for accomodating a check that has never been tested before (don't alert on that one)
workers.processCheckOutcome = function (originalCheckData, checkOutcome) {
    // Decide if the check is up or down in current state
    const state = !checkOutcome.error && checkOutcome.responseCode && originalCheckData.successCodes.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down';

    // Decide if an alert is warranted
    const alertWarranted = originalCheckData.lastChecked && originalCheckData.state !== state ? true : false;

    // Update the check data
    let newCheckData = originalCheckData;

    newCheckData.state = state;
    newCheckData.lastChecked = Date.now();

    // Save the updates
    _data.update('checks', newCheckData.id, newCheckData, function (err) {
        if (!err) {
            // Send the new check data to next phase in the process if needed
            if (alertWarranted) {
                workers.alertUserToStatusChange(newCheckData);
            } else {
                console.log('Check outcome has not changed, no alert needed')
            }
        } else {
            console.log('Error trying to save updates to one of the checks')
        }
    });
};

// Alert the user as to a change in theri check status
workers.alertUserToStatusChange = function (newCheckData) {
    console.log('ddh')
    const msg = 'Alert: Your check for ' + newCheckData.method.toUpperCase() + ' ' + newCheckData.protocol + '://' + newCheckData.url + ' is currently ' + newCheckData.state;
    helpers.sendTwilioSMS(newCheckData.userPhone, msg, function (err) {
        if (!err) {
            console.log('Success: User was alerted to a status change in their check, via sms: ', msg);
        } else {
            console.log('Error: could not send sms alert to user who had a state chage in their check');
        }
    })
}

// Export the module
module.exports = workers