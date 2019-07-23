/**
 * This file is helper for various tasks
 * 
 */

// Dependencies
const crypto = require('crypto');
const config = require('./config');

// Container for all helpers
const helpers = {};

// Create a SHA256 hash
helpers.hash = function (str) {
    if (typeof (str) == 'string' && str.length > 0) {
        const hash = crypto.createHmac('sha256', config.hashingSecret).update(str).digest('hex');
        return hash;
    } else {
        return false;
    }
};

// Parse a JSON string to an object in all cases, without throwing error
helpers.parseJsonToObject = function (str) {
    try {
        const obj = JSON.parse(str);
        return obj;
    } catch (e) {
        return {};
    }
}


// Generate random string of alphanumeric characters of a given numbers
helpers.createRandomString = function (strLength) {
    strLength = typeof (strLength) == "number" && strLength > 0 ? strLength : false;

    if (strLength) {
        //Define all the possible characters that could go into a string
        const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

        // Start the final string
        let str = '';

        for (let i = 1; i <= strLength; i++) {
            // Get Random Characters from the possible characters string
            var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
            // Append to final string
            str += randomCharacter;
        }
        // Return final string
        return str;
    } else {
        return false
    }
}
// Export module
module.exports = helpers;