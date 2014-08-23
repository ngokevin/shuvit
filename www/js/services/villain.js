var $ = require('jquery');
var _ = require('underscore');
var Promise = require('es6-promise').Promise;
var settings = require('../settings');

angular.module('shuvit.services.villain', [])

.service('VillainModel', function() {
    /* id -- long, epoch time for creation of villain
     * name -- name of villain
     * description -- physical description
     * style -- tight or loose + passive or aggressive
     * notes -- notes on their play
     * history -- history versus player
    */
    return {
        fields: ['id', 'name', 'description', 'style', 'notes', 'history'],
        validate: function(villain) {
            return villain.name;
        }
    };
})

.service('VillainService',
    ['DatastoreVillainService', 'DropboxService', 'LocalStorageVillainService',
     'PubSubService', 'VillainModel',
    function(DatastoreVillainService, DropboxService, LocalStorageVillainService,
             PubSubService, VillainModel) {
    // Wraps VillainService to accomodate both localStorage and Dropbox Datastore.
    var villains = [];
    var using;

    PubSubService.subscribe('dropbox-promise', function(dropboxPromise) {
        dropboxPromise.then(function(datastore) {
            // Use Datastore.
            DatastoreVillainService.init(datastore);
            villains = DatastoreVillainService.get();
            using = 'datastore';
            PubSubService.publish('villain-promise', [get()]);
        }, function() {
            // Use localStorage.
            villains = LocalStorageVillainService.get();
            using = 'localstorage';
            PubSubService.publish('villain-promise', [get()]);
        });
    });

    PubSubService.publish('villain-ready');

    function get() {
        if (using == 'datastore') {
            return DatastoreVillainService.get();
        } else {
            return LocalStorageVillainService.get();
        }
    }

    function add(villain) {
        if (!VillainModel.validate(villain)) {
            return;
        }

        // Build the object.
        villain = {
            // ID is epoch. Helps Dropbox merge.
            id: villain.id || new Date().getTime(),
            name: villain.name,
            description: villain.description || '',
            style: villain.style || '',
            notes: villain.notes || '',
            history: villain.history || '',
        };

        LocalStorageVillainService.add(villain);
        if (using == 'datastore') {
            DatastoreVillainService.add(villain);
        }

        return true;
    }

    function del(id) {
        LocalStorageVillainService.del(id);
        if (using == 'datastore') {
            DatastoreVillainService.del(id);
        }
    }

    return {
        get: get,
        add: add,
        del: del,
        update: function(villain) {
            // Update just removes the villain and re-adds.
            del(villain.id);
            return add(villain);
        },
        clear: function(id) {
            LocalStorageVillainService.clear();
        }
    };
}])

.service('DatastoreVillainService',
    ['DropboxService', 'LocalStorageVillainService', 'VillainModel',
    function(DropboxService, LocalStorageVillainService, VillainModel) {
    // Service to deserialize Datastore records to normalized JS objects.
    var villainTable;
    var villains = [];

    function transformVillain(villainRecord) {
        // Transform the Datastore record into a plain JS object.
        var villain = {};
        _.each(VillainModel.fields, function(field) {
            villain[field] = villainRecord.get(field);
        });
        return villain;
    }

    function merge() {
        // Merge LS to Dropbox.
        _.each(LocalStorageVillainService.get(), add);
        _.each(get(), LocalStorageVillainService.add);
    }

    function get() {
        // Refresh and return;
        villains = _.map(villainTable.query(), transformVillain);
        return villains;
    }

    function add(villain) {
        if (villainTable.query({id: villain.id}).length) {
            // Uniquify.
            return;
        }
        villainTable.insert(villain);
    }

    function syncDatastoreToLocalStorage() {
        function getVillainId(villain) {
            return villain.id;
        }

        var datastoreVillains = get();
        var localStorageVillains = LocalStorageVillainService.get();

        var datastoreIds = _.map(datastoreVillains, getVillainId);
        var localStorageIds = _.map(localStorageVillains, getVillainId);

        // Sync added records from Dropbox to LS.
        _.each(datastoreVillains, LocalStorageVillainService.add);

        // Sync deleted records from Dropbox to LS.
        var deletedRemotelyIds = _.difference(localStorageIds, datastoreIds);
        _.each(deletedRemotelyIds, function(id) {
            LocalStorageVillainService.del(id);
        });
    }

    return {
        init: function(datastore) {
            // Open Dropbox villain table.
            villainTable = datastore.getTable('villains');
            merge();
            datastore.recordsChanged.addListener(syncDatastoreToLocalStorage);
        },
        get: get,
        add: add,
        del: function(id) {
            villainTable.query({id: id})[0].deleteRecord();
        },
    };
}])

.service('LocalStorageVillainService', function() {
    var villains = [];

    if (localStorage.getItem('villains')) {
        villains = JSON.parse(localStorage.getItem('villains'));
    } else {
        save();
    }

    function save() {
        localStorage.setItem('villains', JSON.stringify(villains));
    }

    return {
        get: function() {
            return villains;
        },
        add: function(villain) {
            // Uniquify.
            var existing = _.filter(villains, function(_villain) {
                return _villain.id == villain.id;
            });
            if (existing.length) {
                return;
            }

            villains.push(villain);
            save();
        },
        del: function(id) {
            villains = _.reject(villains, function(villain) {
                return villain.id == id;
            });
            save();
        },
        clear: function() {
            villains = [];
        }
    };
});
