var $ = require('jquery');
var _ = require('underscore');
var Promise = require('es6-promise').Promise;
var settings = require('./settings');

angular.module('shuvit.services', [])

.service('SessionService', ['DropboxService', function(DropboxService) {
    // Session => {id, buyin, cash, date, notes, result, title}
    var sessions = [];
    if (localStorage.getItem('sessions')) {
        sessions = deserialize(localStorage.getItem('sessions'));
    } else {
        save();
    }

    var sessionTable;
    DropboxService.promise.then(function(datastore) {
        // Open Dropbox session table.
        sessionTable = datastore.getTable('sessions');
        dropboxRefresh();
        datastore.recordsChanged.addListener(dropboxRefresh());
    });

    function dropboxRefresh() {
        // Refresh and merge sessions from Dropbox.
        var dropboxSessions = sessionTable.query();

        // Sort by ID (creation time).
        _.sortBy(dropboxSessions, function(sessio) {
            return session.date;
        });
    }

    function transform(_sessions) {
        // Attach helper data.
        _sessions = $.extend(true, {}, _sessions);

        var cumulativeProfit = 0;
        var index = 0;
        _sessions = _.map(_sessions, function(d) {
            // Index.
            d.index = index++;

            // Title if it doesn't exist.
            if (!d.title) {
                d.title = 'Session #' + (d.index + 1);
            }

            // Calculate profits.
            d.profit = d.result - d.buyin;
            cumulativeProfit += d.profit;
            d.cumulativeProfit = cumulativeProfit;
            return d;
        });

        return _.map(_sessions, function(session) {
            // Long to date.
            session.date = new Date(session.date);
            return session;
        });
    }

    function serialize(_sessions) {
        // To LS.
        return JSON.stringify(sessions);
    }

    function deserialize(_sessions) {
        // From LS.
        return JSON.parse(_sessions);
    }

    function save() {
        localStorage.setItem('sessions', serialize(sessions));
    }

    return {
        get: function(mock) {
            if (mock) {
                return transform([
                    {id: 0, date: new Date(2014, 7, 31), buyin: 50, result: 500},
                    {id: 1, date: new Date(2014, 8, 1), buyin: 40, result: 0},
                    {id: 2, date: new Date(2014, 8, 2), buyin: 60, result: 350}
                ]);
            }
            return transform(sessions);
        },

        add: function(session) {
            /* Add a session, which consists of.
             * buyin -- integer, how much they bought in with
             * cash -- cash vs tournmanet, boolean
             * date -- in milliseconds
             * notes -- miscellaneous notes, string
             * result -- integer, how much they came out with including buyin
             * title -- name of session, string
             */
            if (!(session.date && session.buyin >= 0 && session.result >= 0)) {
                // Validate.
                return;
            }

            // Build the object.
            sessions.push({
                id: new Date().getTime(),  // ID is epoch. Helps Dropbox merge.
                buyin: parseInt(session.buyin, 10),
                cash: session.cash || false,
                date: session.date,
                notes: session.notes,
                result: parseInt(session.result, 10),
                title: session.title,
            });

            sessions = _.sortBy(sessions, function(_session) {
                return _session.date;
            });

            save();
            return true;
        },

        del: function(id) {
            sessions = _.reject(sessions, function(session) {
                return session.id == id;
            });
            save();
        },
    };
}])

.service('DropboxService', function() {
    // Dropbox stuff.
    var client = new Dropbox.Client({key: settings.dropboxKey});

    if (window.cordova) {
        client.authDriver(new Dropbox.AuthDriver.Cordova());
    }

    // Try to complete OAuth flow.
    var promise = new Promise(function(resolve, reject) {
        // Authenticate and open datastore.
        client.authenticate({interactive: false}, function(error) {
            if (error) {
                console.log(error);
                reject();
                return;
            }

            console.log('Dropbox authenticated.');
            if (client.isAuthenticated()) {
                // Set the table.
                var manager = client.getDatastoreManager();
                manager.openDefaultDatastore(function(error, datastore) {
                    // openDefaultDatastore is async.
                    if (error) {
                        console.log(error);
                        reject();
                        return;
                    }
                    resolve(datastore);
                });
            }
        });
    });

    return {
        client: client,
        promise: promise
    };
});
