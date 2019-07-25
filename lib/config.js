/**
 * Creating a and export configuration variables
 * 
 */

// Container for all the environments
var environments = {};

// Staging (default) environment
environments.staging = {
    'httpPort': 1600,
    'httpsPort': 1601,
    'envName': 'staging',
    'hashingSecret': 'thisIsASecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': 'ACb32d411ad7fe886aac54c665d25e5c5d',
        'authToken': '9455e3eb3109edc12e3d8c92768f7a67',
        'fromPhone': '+2348023156108'
    },
    'templateGlobals': {
        'appName': 'UptimeChecker',
        'companyName': 'NotARealCompany Inc',
        'yearCreated': '2019',
        'baseUrl': 'http://localhost:1600/'
    }
};

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoSecret',
    'maxChecks': 5,
    'twilio': {
        'accountSid': '',
        'authToken': '',
        'fromPhone': ''
    },
    'templateGlobals': {
        'appName': 'UptimeChecker',
        'companyName': 'NotARealCompany Inc',
        'yearCreated': '2019',
        'baseUrl': 'http://localhost:5000/'
    }
};

// Determin which environment is passed as a command-line argument
var currentEnvironment = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if current environment is one of the environments above, if not, default to staging
var environmentToExport = typeof (environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;