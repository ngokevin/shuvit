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
    ['DatastoreSessionService', 'DropboxService', 'LocalStorageSessionService',
     'PubSubService', 'SessionModel',
    function(DatastoreSessionService, DropboxService, LocalStorageSessionService,
             PubSubService, SessionModel) {
    // Wraps SessionService to accomodate both localStorage and Dropbox Datastore.
    var sessions = [];
    var using;

    PubSubService.subscribe('dropbox-promise', function(dropboxPromise) {
        dropboxPromise.then(function(datastore) {
            // Use Datastore.
            DatastoreSessionService.init(datastore);
            sessions = DatastoreSessionService.get();
            using = 'datastore';
            PubSubService.publish('session-promise', [get()]);
        }, function() {
            // Use localStorage.
            sessions = LocalStorageSessionService.get();
            using = 'localstorage';
            PubSubService.publish('session-promise', [get()]);
        });
    });

    PubSubService.publish('session-ready');

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

    function get(mock) {
        if (mock) {
            return transform([{
                id: new Date().getTime(),
                buyin: 100,
                cash: false,
                date: new Date(2014, 7, 31),
                notes: 'ngokevin.com',
                result: 200,
                title: 'ngokevin.com'
            }]);
        }

        if (using == 'datastore') {
            return transform(DatastoreSessionService.get());
        } else {
            return transform(LocalStorageSessionService.get());
        }
    }

    function add(session) {
        if (!SessionModel.validate(session)) {
                return;
        }

        // Build the object.
        session = {
            // ID is epoch. Helps Dropbox merge.
            id: session.id || new Date().getTime(),
            buyin: parseInt(session.buyin, 10),
            cash: session.cash || false,
            date: session.date,
            notes: session.notes || '',
            result: parseInt(session.result, 10),
            title: session.title || '',
        };

        LocalStorageSessionService.add(session);
        if (using == 'datastore') {
            DatastoreSessionService.add(session);
        }

        return true;
    }

    function del(id) {
        LocalStorageSessionService.del(id);
        if (using == 'datastore') {
            DatastoreSessionService.del(id);
        }
    }

    return {
        get: get,
        add: add,
        del: del,
        update: function(session) {
            // Update just removes the session and re-adds.
            del(session.id);
            return add(session);
        },
        clear: function(id) {
            LocalStorageSessionService.clear();
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

    function syncDatastoreToLocalStorage() {
        function getSessionId(session) {
            return session.id;
        }

        var datastoreSessions = get();
        var localStorageSessions = LocalStorageSessionService.get();

        var datastoreIds = _.map(datastoreSessions, getSessionId);
        var localStorageIds = _.map(localStorageSessions, getSessionId);

        // Sync added records from Dropbox to LS.
        _.each(datastoreSessions, LocalStorageSessionService.add);

        // Sync deleted records from Dropbox to LS.
        var deletedRemotelyIds = _.difference(localStorageIds, datastoreIds);
        _.each(deletedRemotelyIds, function(id) {
            LocalStorageSessionService.del(id);
        });
    }

    return {
        init: function(datastore) {
            // Open Dropbox session table.
            sessionTable = datastore.getTable('sessions');
            merge();
            datastore.recordsChanged.addListener(syncDatastoreToLocalStorage);
        },
        get: get,
        add: add,
        del: function(id) {
            sessionTable.query({id: id})[0].deleteRecord();
        },
    };
}])

.service('StatsService', ['SessionService', function(SessionService) {
    var sessions = SessionService.get();

    function get() {
        sessions = SessionService.get();
    }

    function avgBuyin() {
        get();
        return (buyins() / numSessions()).toFixed(2) || 0;
    }

    function avgResult() {
        get();
        return (results() / numSessions()).toFixed(2) || 0;
    }

    function buyins() {
        get();
        return _.reduce(sessions, function(_buyin, session) {
            return _buyin + session.buyin;
        }, 0).toFixed(0);
    }

    function numSessions() {
        get();
        return sessions.length;
    }

    function profit() {
        get();
        return _.reduce(sessions, function(_profit, session) {
            return _profit + session.profit;
        }, 0).toFixed(0);
    }

    function results() {
        get();
        return _.reduce(sessions, function(_result, session) {
            return _result + session.result;
        }, 0).toFixed(0);
    }

    return {
        avgBuyin: avgBuyin,
        avgResult: avgResult,
        buyins: buyins,
        numSessions: numSessions,
        profit: profit,
        results: results,
        roi: function() {
            // (Gain - Cost) / Cost
            return ((results() - buyins()) /
                    buyins() * 100).toFixed(2) || 0;
        }
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
        },
        clear: function() {
            sessions = [];
        }
    };
})

.service('DropboxService', ['PubSubService', function(PubSubService) {
    // Dropbox stuff.
    var client = createClient();
    var promise;

    function createClient() {
        // Creates a fresh client.
        var client = new Dropbox.Client({key: settings.dropboxKey});
        if (window.cordova) {
            client.authDriver(new Dropbox.AuthDriver.Cordova());
        }
        return client;
    }

    function createPromise() {
        // Try to complete OAuth flow.
        return new Promise(function(resolve, reject) {
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
    }

    function refresh() {
        client = createClient();
        PubSubService.publish('dropbox-promise', [createPromise()]);
    }

    PubSubService.subscribe('session-ready', function() {
        PubSubService.publish('dropbox-promise', [createPromise()]);
        $(document).trigger('dropbox-promise');
    });

    return {
        getClient: function() {
            return client;
        },
        refresh: refresh
    };
}])

.service('PubSubService', function() {
    // Inter-service communication.
    var cache = {};
    return {
        publish: function(topic, args) {
            cache[topic] && $.each(cache[topic], function() {
                this.apply(null, args || []);
            });
        },
        subscribe: function(topic, callback) {
            if (!cache[topic]) {
                cache[topic] = [];
            }
            cache[topic].push(callback);
            return [topic, callback];
        },
        unsubscribe: function(handle) {
            var t = handle[0];
            cache[t] && $.each(cache[t], function(idx){
                if (this == handle[1]) {
                    cache[t].splice(idx, 1);
                }
            });
        }
    };
});
