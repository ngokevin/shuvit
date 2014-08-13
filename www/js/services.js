var $ = require('jquery');
var _ = require('underscore');
var Promise = require('es6-promise').Promise;
var settings = require('./settings');

angular.module('shuvit.services', [])

.service('SessionModel', function() {
    /* id -- long, epoch time for creation of session
     * buyin -- integer, how much they bought in with
     * cash -- cash vs tournmaent, boolean
     * date -- in milliseconds
     * notes -- miscellaneous notes, string
     * result -- integer, how much they came out with including buyin
     * title -- name of session, string
    */
    return {
        fields: ['id', 'buyin', 'cash', 'date', 'notes', 'result', 'title'],
        validate: function(session) {
            return session.date && session.buyin >= 0 && session.result >= 0;
        }
    };
})

.service('SessionService',
    ['DatastoreSessionService', 'DropboxService', 'LocalStorageSessionService', 'SessionModel',
    function(DatastoreSessionService, DropboxService, LocalStorageSessionService, SessionModel) {
    // Wraps SessionService to accomodate both localStorage and Dropbox Datastore.
    var sessions = [];
    var using;

    var promise = new Promise(function(resolve) {
        DropboxService.promise.then(function(datastore) {
            // Use Datastore.
            DatastoreSessionService.init(datastore);
            sessions = DatastoreSessionService.get();
            using = 'datastore';
            resolve();
        }, function() {
            // Use localStorage.
            sessions = LocalStorageSessionService.get();
            using = 'localstorage';
            resolve();
        });
    });

    function transform(_sessions) {
        // Attach helper data.
        _sessions = $.extend(true, {}, _sessions);  // Extend, no overwrite.

        var cumulativeProfit = 0;
        var index = 0;
        _sessions = _.map(_sessions, function(d) {
            // Add an index.
            d.index = index++;

            // Add a title for those that don't have any.
            if (!d.title) {
                d.title = 'Session #' + (d.index + 1);
            }

            // Add profits.
            d.profit = d.result - d.buyin;
            cumulativeProfit += d.profit;
            d.cumulativeProfit = cumulativeProfit;
            return d;
        });

        return _.map(_sessions, function(session) {
            // Convert long to date.
            session.date = new Date(session.date);
            return session;
        });
    }

    return {
        promise: promise,
        get: function(mock) {
            if (mock) {
                return transform([
                    {id: 0, date: new Date(2014, 7, 31), buyin: 50, result: 500},
                    {id: 1, date: new Date(2014, 8, 1), buyin: 40, result: 0},
                    {id: 2, date: new Date(2014, 8, 2), buyin: 60, result: 350}
                ]);
            }

            if (using == 'datastore') {
                return transform(DatastoreSessionService.get());
            } else {
                return transform(LocalStorageSessionService.get());
            }
        },
        add: function(session) {
            if (!SessionModel.validate(session)) {
                return;
            }

            // Build the object.
            session = {
                id: new Date().getTime(),  // ID is epoch. Helps Dropbox merge.
                buyin: parseInt(session.buyin, 10),
                cash: session.cash || false,
                date: session.date,
                notes: session.notes || '',
                result: parseInt(session.result, 10),
                title: session.title,
            };

            LocalStorageSessionService.add(session);
            if (using == 'datastore') {
                DatastoreSessionService.add(session);
            }

            return true;
        },
        del: function(id) {
            LocalStorageSessionService.del(id);
            if (using == 'datastore') {
                DatastoreSessionService.del(id);
            }
        }
    };
}])

.service('DatastoreSessionService',
    ['DropboxService', 'LocalStorageSessionService', 'SessionModel',
    function(DropboxService, LocalStorageSessionService, SessionModel) {
    // Service to deserialize Datastore records to normalized JS objects.
    var sessionTable;
    var sessions = [];

    function transformSession(sessionRecord) {
        // Transform the Datastore record into a plain JS object.
        var session = {};
        _.each(SessionModel.fields, function(field) {
            session[field] = sessionRecord.get(field);
        });
        return session;
    }

    function merge() {
        // Merge LS to Dropbox.
        _.each(LocalStorageSessionService.get(), add);
        _.each(get(), LocalStorageSessionService.add);
    }

    function get() {
        // Refresh and return;
        sessions = _.map(sessionTable.query(), transformSession);
        return sessions;
    }

    function add(session) {
        if (sessionTable.query({id: session.id}).length) {
            // Uniquify.
            return;
        }
        sessionTable.insert(session);
    }

    return {
        init: function(datastore) {
            // Open Dropbox session table.
            sessionTable = datastore.getTable('sessions');
            merge();
            datastore.recordsChanged.addListener(function(session) {
                // Refresh and merge Dropbox to LS.
                _.each(get(), LocalStorageSessionService.add);
            });
        },
        get: get,
        add: add,
        del: function(id) {
            sessionTable.query({id: id})[0].deleteRecord();
        },
    };
}])

.service('LocalStorageSessionService', function() {
    var sessions = [];

    if (localStorage.getItem('sessions')) {
        sessions = deserialize(localStorage.getItem('sessions'));
    } else {
        save();
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
        get: function() {
            return sessions;
        },
        add: function(session) {
            // Uniquify.
            var existing = _.filter(sessions, function(_session) {
                return _session.id == session.id;
            });
            if (existing.length) {
                return;
            }

            sessions.push(session);
            save();
        },
        del: function(id) {
            sessions = _.reject(sessions, function(session) {
                return session.id == id;
            });
            save();
        }
    };
})

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
                    console.log('Dropbox authenticated.');
                    resolve(datastore);
                });
            } else {
                console.log('Dropbox not authenticated.');
                reject();
            }
        });
    });

    return {
        client: client,
        promise: promise
    };
});
