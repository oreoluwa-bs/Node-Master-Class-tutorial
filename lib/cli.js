/**
 * CLI Related tasks
 * 
 */

// Dependencies
const readline = require('readline');
const util = require('util');
const debug = util.debuglog('cli');
const events = require('events');
class _events extends events { };
const e = new _events();
const os = require('os');
const v8 = require('v8');
const _data = require('./data');
const _logs = require('./logs');
const helpers = require('./helpers');

// Instatiate the cli module object
const cli = {};



// init script
cli.init = function () {
    // Send start message to the console, in dark blue
    console.log('\x1b[34m%s\x1b[0m', 'The ClI is running');

    // Start the interface
    const _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        promt: '>'
    });

    // Create an initital prompt
    _interface.prompt();

    // Handle each line of input separately
    _interface.on('line', function (str) {
        // send to the input proccessor
        cli.processInput(str);

        // Re-initialize the prompt
        _interface.prompt();
    });

    // if the user stops the cli, kill associated proccess
    _interface.on('close', function () {
        process.exit(0);
    });

}

// Input handlers
e.on('man', function (str) {
    cli.responders.help();
});

e.on('help', function (str) {
    cli.responders.help();
});

e.on('exit', function (str) {
    cli.responders.exit();
});

e.on('stats', function (str) {
    cli.responders.stats();
});

e.on('list users', function (str) {
    cli.responders.listUsers();
});

e.on('more user info', function (str) {
    cli.responders.moreUserInfo(str);
});

e.on('list checks', function (str) {
    cli.responders.listChecks(str);
});

e.on('more check info', function (str) {
    cli.responders.moreCheckInfo(str);
});

e.on('list logs', function (str) {
    cli.responders.listLogs();
});

e.on('more log info', function (str) {
    cli.responders.moreLogInfo(str);
});

// Responders
cli.responders = {};

// Help / Man
cli.responders.help = function () {
    const commands = {
        'exit': 'Kill the CLI (and the rest of the application)',
        'man': 'Show this help page',
        'help': 'Alias of the "man" command',
        'stats': 'Get statistics on the underlying operating system and resource utilization',
        'list users': 'Show a list of all the registered (undeleted) users in the system',
        'more user info --{userId}': 'Show details of a specified user',
        'list checks --up --down': 'Show a list of all the active checks in the system, including their state. The --up and the --down flags are optional',
        'more check info --{checkId}': 'Show details of a specified check',
        'list logs': 'Show a list of all the log files available to be read (compressed only)',
        'more log info --{fileName}': 'Show details of a specified log file',
    };

    // Show a header for the help page that is as wide as the screen
    cli.horizontalLine();
    cli.centered('CLI MANUAL');
    cli.horizontalLine();
    cli.vericalSpace(2);

    // Show each command followed by its explanation, in white and yellow respectivly
    for (const key in commands) {
        if (commands.hasOwnProperty(key)) {
            const value = commands[key];
            let line = '\x1b[33m' + key + '\x1b[0m';
            const padding = 60 - line.length;
            for (let i = 0; i < padding; i++) {
                line += ' ';
            }
            line += value;
            console.log(line);
            cli.vericalSpace();
        }
    }

    cli.vericalSpace(1);

    // End with another horizontal line
    cli.horizontalLine();
};

// Create a horizontal line accross the screen
cli.horizontalLine = function () {
    // Get the available screen size
    const width = process.stdout.columns;

    let line = '';

    for (let i = 0; i < width; i++) {
        line += '-';
    }
    console.log(line);
};
// Center a given text
cli.centered = function (str) {
    str = typeof (str) == 'string' && str.trim().length > 0 ? str.trim() : '';

    // Get the available screen size
    const width = process.stdout.columns;

    // Calculate the left padding there should be
    const leftPadding = Math.floor((width - str.length) / 2);

    // Put in left padding spaces before the string itself
    let line = '';
    for (let i = 0; i < leftPadding; i++) {
        line += '';
    }
    line += str;
    console.log(line);
};
// Create a vertical space
cli.vericalSpace = function (lines) {
    lines = typeof (lines) == 'number' && lines > 0 ? lines : 1;
    for (let i = 0; i < lines; i++) {
        console.log('');
    }
};

// Exit
cli.responders.exit = function () {
    process.exit(0);
};

// Stats
cli.responders.stats = function () {
    // Compile an object called stats
    const stats = {
        'Load Average': os.loadavg().join(' '),
        'CPU Count': os.cpus().length,
        'Free Memory': os.freemem(),
        'Currently Malloced Memory': v8.getHeapStatistics().malloced_memory,
        'Peaked Malloced Memory': v8.getHeapStatistics().peak_malloced_memory,
        'Available Heap Used (%)': Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),
        'Available Heap Allocated (%)': Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),
        'Uptime': os.uptime() + ' Seconds',
    };

    // Create a header for the stats
    cli.horizontalLine();
    cli.centered('SYSTEM STATISTICS');
    cli.horizontalLine();
    cli.vericalSpace(2);

    // Show each command followed by its explanation, in white and yellow respectivly
    for (const key in stats) {
        if (stats.hasOwnProperty(key)) {
            const value = stats[key];
            let line = '\x1b[33m' + key + '\x1b[0m';
            const padding = 60 - line.length;
            for (let i = 0; i < padding; i++) {
                line += ' ';
            }
            line += value;
            console.log(line);
            cli.vericalSpace();
        }
    }

    cli.vericalSpace(1);

    // End with another horizontal line
    cli.horizontalLine();
};

// List users
cli.responders.listUsers = function () {
    _data.list('users', function (err, userIds) {
        if (!err && userIds && userIds.length > 0) {
            cli.vericalSpace();
            userIds.forEach(userId => {
                _data.read('users', userId, function (err, userData) {
                    if (!err && userData) {
                        let line = "Name: " + userData.firstName + ' ' + userData.lastName + ' Phone: ' + userData.phone + ' Checks: ';
                        const numberOfChecks = typeof (userData.checks) == 'object' && userData.checks instanceof Array && userData.checks.length > 0 ? userData.checks.length : 0;
                        line += numberOfChecks;
                        console.log(line);
                        cli.vericalSpace()
                    }
                });
            });
        }
    })
};

// More user info
cli.responders.moreUserInfo = function (str) {
    // Get the id from the string
    const arr = str.split('--');
    const userId = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;

    if (userId) {
        // look up user
        _data.read('users', userId, function (err, userData) {
            if (!err && userData) {
                // Remove the hashed password
                delete userData.hashedPassword;

                //Print the json with text highlighting
                cli.vericalSpace();
                console.dir(userData, { 'colors': true });
                cli.vericalSpace();
            }
        });
    }
};

// list checks
cli.responders.listChecks = function (str) {
    _data.list('checks', function (err, checkIds) {
        if (!err && checkIds && checkIds.length > 0) {
            cli.vericalSpace();
            checkIds.forEach(checkId => {
                _data.read('checks', checkId, function (err, checkData) {
                    if (!err && checkData) {
                        let includeCheck = false;
                        const lowerString = str.toLowerCase();

                        // Get the state, default to down
                        const state = typeof (checkData.state) == 'string' ? checkData.state : 'down';
                        // Get the state, default to unknown
                        const stateOrUnknown = typeof (checkData.state) == 'string' ? checkData.state : 'unknown';
                        // if the user has specified the state, or hasn't specified any state, include the current check
                        if (lowerString.indexOf('--' + state) > -1 || (lowerString.indexOf('--down') == -1 && lowerString.indexOf('--up') == -1)) {
                            const line = 'ID: ' + checkData.id + ' ' + checkData.method.toUpperCase() + ' ' + checkData.protocol + '://' + checkData.url + ' State: ' + stateOrUnknown;
                            console.log(line);
                            cli.vericalSpace();
                        }
                    }
                })
            });
        }
    })
};

// More check info
cli.responders.moreCheckInfo = function (str) {
    // Get the id from the string
    const arr = str.split('--');
    const checkId = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;

    if (checkId) {
        // look up check
        _data.read('checks', checkId, function (err, checkData) {
            if (!err && checkData) {
                //Print the json with text highlighting
                cli.vericalSpace();
                console.dir(checkData, { 'colors': true });
                cli.vericalSpace();
            }
        });
    }
};

// List logs
cli.responders.listLogs = function () {
    _logs.list(true, function (err, logFileNames) {
        if (!err && logFileNames && logFileNames.length > 0) {
            cli.vericalSpace();
            logFileNames.forEach(logFileName => {
                if (logFileName.indexOf('-') > -1) {
                    console.log(logFileName);
                    cli.vericalSpace();
                }
            });
        }
    })
};

// More logs info
cli.responders.moreUsersInfo = function (str) {
    // Get the log file name from the string
    const arr = str.split('--');
    const logFileName = typeof (arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1].trim() : false;

    if (logFileName) {
        cli.vericalSpace();
        // decompress the log file
        _logs.decompress(logFileName, function (err, strData) {
            if (!err && strData) {
                // Split into lines
                let arr = strData.split('\n');

                arr.forEach(jsonString => {
                    const logObject = helpers.parseJsonToObject(jsonString);
                    if (logObject && JSON.stringify(logObject) !== '{}') {
                        console.dir(logObject, { 'colors': true });
                        cli.vericalSpace();
                    }
                });
            }
        })
    }
};

// Input processor
cli.processInput = function (str) {
    str = typeof (str) == 'string' && str.trim().length > 0 ? str.trim() : false;
    // Only proccess input if the user actually wrote something. Otherwise ignore it
    if (str) {
        // Codify the unique strings that identify the unique questions allowed to be asked;
        const uniqueInputs = [
            'man',
            'help',
            'exit',
            'stats',
            'list users',
            'more user info',
            'list checks',
            'more check info',
            'list logs',
            'more log info'
        ];

        // Go through the possible inputs, emit an event when match is found
        let matchFound = false;
        let counter = 0;

        uniqueInputs.some(function (input) {
            if (str.toLowerCase().indexOf(input) > -1) {
                matchFound = true;
                // Emit an event matching the input and include  the full string  given to the user
                e.emit(input, str);
                return true;
            }
        });

        // if no match is found, tell the user to try again
        if (!matchFound) {
            console.log("Sorry, try again");
        }
    }
}

// Export the module
module.exports = cli;