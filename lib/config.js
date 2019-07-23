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
    'maxChecks' : 5
};

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'envName': 'production',
    'hashingSecret': 'thisIsAlsoSecret',
    'maxChecks' : 5
};

// Determin which environment is passed as a command-line argument
var currentEnvironment = typeof (process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

// Check if current environment is one of the environments above, if not, default to staging
var environmentToExport = typeof (environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging;

// Export the module
module.exports = environmentToExport;