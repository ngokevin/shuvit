var $ = require('jquery');
var Promise = require('es6-promise').Promise;
require('./services/session');
require('./services/villain');
var settings = require('./settings');

angular.module('shuvit.services', [
    'shuvit.services.session',
    'shuvit.services.villain'
])

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

    var sessionReady;
    var villainReady;
    function tryPublishPromise() {
        if (sessionReady && villainReady) {
            PubSubService.publish('dropbox-promise', [createPromise()]);
            $(document).trigger('dropbox-promise');
        }
    }
    PubSubService.subscribe('session-ready', function() {
        sessionReady = true;
        tryPublishPromise();
    });
    PubSubService.subscribe('villain-ready', function() {
        villainReady = true;
        tryPublishPromise();
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
