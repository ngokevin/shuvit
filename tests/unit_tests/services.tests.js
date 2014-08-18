var $ = require('jquery');

// Localstorage mock.
var store = {};
function getItemMock(key) {
    return store[key];
}
function setItemMock(key, value) {
    store[key] = value;
}
function mockLocalStorage() {
    Object.defineProperty(localStorage, 'getItem', {
        value: getItemMock, writable: true
    });
    Object.defineProperty(localStorage, 'setItem', {
        value: setItemMock, writable: true
    });
    spyOn(localStorage, 'getItem').andCallFake(getItemMock);
    spyOn(localStorage, 'setItem').andCallFake(setItemMock);
}

// Creates a fake session object for testing.
function sessionFactory(_session) {
    var session = {
        buyin: 100,
        cash: false,
        date: new Date().getTime(),
        notes: 'ngokevin.com',
        result: 200,
        title: 'ngokevin.com'
    };
    return $.extend(true, session, _session);
}

describe('SessionService', function() {
    beforeEach(function() {
        // Browserify does not allow angular-mocks set window.module.
        window.angular.mock.module('shuvit');
        mockLocalStorage();
    });

    afterEach(function() {
        store = {};
    });

    it('can get', function() {
        store.sessions = JSON.stringify([sessionFactory()]);
        inject(function(SessionService) {
            expect(SessionService.get()[0].notes).toEqual('ngokevin.com');
        });
    });

    it('can get with deserialized date', function() {
        store.sessions = JSON.stringify([sessionFactory()]);
        inject(function(SessionService) {
            expect(SessionService.get()[0].date).toEqual(jasmine.any(Date));
        });
    });

    it('can get with index', function() {
        store.sessions = JSON.stringify([sessionFactory(), sessionFactory()]);
        inject(function(SessionService) {
            expect(SessionService.get()[0].index).toEqual(0);
            expect(SessionService.get()[1].index).toEqual(1);
        });
    });

    it('can get with auto-generated title', function() {
        store.sessions = JSON.stringify([
            sessionFactory({title: ''}),
            sessionFactory(),
            sessionFactory({title: ''})
        ]);
        inject(function(SessionService) {
            expect(SessionService.get()[0].title).toEqual('Session #1');
            expect(SessionService.get()[1].title).toEqual('ngokevin.com');
            expect(SessionService.get()[2].title).toEqual('Session #3');
        });
    });

    it('can get with profit', function() {
        store.sessions = JSON.stringify([sessionFactory()]);
        inject(function(SessionService) {
            expect(SessionService.get()[0].profit).toEqual(100);
        });
    });

    it('can get with cumulative profit', function() {
        store.sessions = JSON.stringify([
            sessionFactory(),  // Profit 100.
            sessionFactory({buyin: 200, result: 0}),  // Profit -200
            sessionFactory({buyin: 100, result: 1000}),  // Profit 900
        ]);
        inject(function(SessionService) {
            expect(SessionService.get()[0].cumulativeProfit).toEqual(100);
            expect(SessionService.get()[1].cumulativeProfit).toEqual(-100);
            expect(SessionService.get()[2].cumulativeProfit).toEqual(800);
        });
    });

    it('can add', function() {
        inject(function(SessionService) {
            var session = sessionFactory();
            SessionService.add(session);
            expect(SessionService.get()[0].id).toBeTruthy();
            expect(SessionService.get()[0].buyin).toEqual(100);
            expect(SessionService.get()[0].cash).toEqual(false);
            expect(SessionService.get()[0].date).toBeTruthy();
            expect(SessionService.get()[0].notes).toEqual('ngokevin.com');
            expect(SessionService.get()[0].result).toEqual(200);
            expect(SessionService.get()[0].title).toEqual('ngokevin.com');
        });
    });

    it('can add while ignoring duplicates', function() {
        inject(function(SessionService) {
            var session = sessionFactory();
            SessionService.add(session);
            SessionService.add(session);
            expect(SessionService.get().length).toEqual(1);
        });
    });

    it('can add with validation', function() {
        inject(function(SessionService) {
            SessionService.add({buyin: ''});
            SessionService.add({buyin: -10});
            SessionService.add({buyin: 'abc'});
            SessionService.add({date: ''});
            SessionService.add({result: ''});
            SessionService.add({result: -10});
            SessionService.add({result: 'abc'});
            expect(SessionService.get().length).toEqual(0);
        });
    });

    it('can delete', function() {
        inject(function(SessionService) {
            SessionService.add(sessionFactory());
            expect(SessionService.get().length).toEqual(1);
            SessionService.del(SessionService.get()[0].id);
            expect(SessionService.get().length).toEqual(0);
        });
    });

    it('can update', function() {
        var session = sessionFactory();
        session.id = 12345;

        inject(function(SessionService) {
            SessionService.add(session);
            expect(SessionService.get().length).toEqual(1);

            // Modify data.
            session.buyin = 500;
            session.notes = 'Updated!';
            session.result = 500;

            // Check we removed a session and re-added it.
            SessionService.update(session);
            expect(SessionService.get().length).toEqual(1);

            // Check fields are expected after update.
            var new_session = SessionService.get()[0];
            expect(new_session.id).toEqual(12345);
            expect(new_session.notes).toEqual('Updated!');
            expect(new_session.buyin).toEqual(500);
            expect(new_session.result).toEqual(500);
        });
    });

    it('can clear', function() {
        inject(function(SessionService) {
            SessionService.add(sessionFactory());
            SessionService.clear();
            expect(SessionService.get().length).toEqual(0);
        });
    });
});


describe('DatastoreSessionService', function() {
    var datastore;

    beforeEach(function() {
        // Browserify does not allow angular-mocks set window.module.
        window.angular.mock.module('shuvit');
        mockLocalStorage();

        // Mock Dropbox.
        var key = require('../../www/js/settings').dropboxKey;
        global.Dropbox = new (require('dropbox-mock'))();
        global.Dropbox.allowAppKey(key);
        var client = new global.Dropbox.Client({key: key});
        client.authenticate({interactive: false});
        var manager = client.getDatastoreManager();
        manager.openDefaultDatastore(function(error, _datastore) {
            datastore = _datastore;
        });
        global.Dropbox.sessions = [];
    });

    afterEach(function() {
        datastore = null;
        global.Dropbox.sessions = [];
        store = {};
    });

    it('can init', function() {
        inject(function(DatastoreSessionService) {
            DatastoreSessionService.init(datastore);
            expect(global.Dropbox.sessions.length).toEqual(0);
        });
    });

    it('can get', function() {
        var session = sessionFactory();
        global.Dropbox.sessions = [session];
        inject(function(DatastoreSessionService) {
            DatastoreSessionService.init(datastore);
            var retrievedSession = DatastoreSessionService.get()[0];
            expect(retrievedSession.date).toEqual(session.date);
        });
    });

    it('can merge localStorage to datastore on init', function() {
        var session = sessionFactory();
        store.sessions = JSON.stringify([session]);
        inject(function(DatastoreSessionService) {
            DatastoreSessionService.init(datastore);
            expect(global.Dropbox.sessions.length).toEqual(1);
            expect(global.Dropbox.sessions[0].date).toEqual(session.date);
        });
    });

    it('can merge datastore to localStorage on init', function() {
        var session = sessionFactory();
        global.Dropbox.sessions = [session];  // Initial SessionTable from DB.
        inject(function(DatastoreSessionService) {
            DatastoreSessionService.init(datastore);
            expect(JSON.parse(store.sessions).length).toEqual(1);
            expect(JSON.parse(store.sessions)[0].date).toEqual(session.date);
        });
    });

    it('can merge datastore and localStorage on init', function() {
        // Init datastore.
        var session_A = sessionFactory();
        session_A.id = 123;
        global.Dropbox.sessions = [session_A];

        // Init localStorage.
        var session_B = sessionFactory();
        session_B.id = 456;
        store.sessions = JSON.stringify([session_B]);

        inject(function(DatastoreSessionService) {
            DatastoreSessionService.init(datastore);

            // Check datastore.
            expect(global.Dropbox.sessions.length).toEqual(2);
            expect(global.Dropbox.sessions[0].id).toEqual(123);
            expect(global.Dropbox.sessions[1].id).toEqual(456);

            // Check localStorage.
            expect(JSON.parse(store.sessions).length).toEqual(2);
            expect(JSON.parse(store.sessions)[0].id).toEqual(456);
            expect(JSON.parse(store.sessions)[1].id).toEqual(123);
        });
    });

    it('can add', function() {
        var session = sessionFactory();
        inject(function(DatastoreSessionService) {
            DatastoreSessionService.init(datastore);
            DatastoreSessionService.add(session);
            expect(global.Dropbox.sessions[0].date).toEqual(session.date);

            // Check adding to ds adds to ls.
            global.Dropbox.triggerRecordsChanged();  // Mock trigger.
            expect(JSON.parse(store.sessions)[0].date).toEqual(session.date);
        });
    });

    it('can add while ignoring duplicates', function() {
        var session = sessionFactory();
        inject(function(DatastoreSessionService) {
            DatastoreSessionService.init(datastore);
            DatastoreSessionService.add(session);
            DatastoreSessionService.add(session);
            expect(global.Dropbox.sessions.length).toEqual(1);

            // Check ds adding to ls also ignores duplicates.
            global.Dropbox.triggerRecordsChanged();
            expect(JSON.parse(store.sessions).length).toEqual(1);
        });
    });

    it('can delete', function() {
        var session = sessionFactory();
        inject(function(DatastoreSessionService) {
            DatastoreSessionService.init(datastore);
            DatastoreSessionService.add(session);
            global.Dropbox.triggerRecordsChanged();
            expect(global.Dropbox.sessions.length).toEqual(1);
            expect(JSON.parse(store.sessions).length).toEqual(1);

            DatastoreSessionService.del(DatastoreSessionService.get()[0].id);
            expect(global.Dropbox.sessions.length).toEqual(0);

            // Check deleting from ds deletes from ls.
            global.Dropbox.triggerRecordsChanged();
            expect(JSON.parse(store.sessions).length).toEqual(0);
        });
    });

    it('can sync both add and delete on triggerRecordsChange to ls', function() {
        var session_A = sessionFactory({id: 1, notes: 'A'});
        var session_B = sessionFactory({id: 2, notes: 'B'});
        var session_C = sessionFactory({id: 3, notes: 'C'});

        // We will remove A and add C.
        // Leaving localStorage with B and C.
        global.Dropbox.sessions = [session_A];
        store.sessions = JSON.stringify([session_B]);

        inject(function(DatastoreSessionService) {
            DatastoreSessionService.init(datastore);
            global.Dropbox.triggerRecordsChanged();
            expect(JSON.parse(store.sessions)[0].notes).toEqual('B');
            expect(JSON.parse(store.sessions)[1].notes).toEqual('A');

            global.Dropbox.sessions = [session_B, session_C];
            global.Dropbox.triggerRecordsChanged();
            expect(JSON.parse(store.sessions)[0].notes).toEqual('B');
            expect(JSON.parse(store.sessions)[1].notes).toEqual('C');
        });
    });
});
