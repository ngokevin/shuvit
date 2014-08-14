var $ = require('jquery');

describe('SessionService', function() {
    var store = {};

    var ls = function() {
        return JSON.parse(store.storage);
    };

    beforeEach(function() {
        // Browserify does not allow angular-mocks set window.module.
        window.angular.mock.module('shuvit');

        // LocalStorage mock.
        function getItemMock(key) {
            return store[key];
        }
        function setItemMock(key) {
            store[key] = value;
        }
        Object.defineProperty(localStorage, 'getItem', {
            value: getItemMock,
            writable: true
        });
        Object.defineProperty(localStorage, 'setItem', {
            value: setItemMock,
            writable: true
        });
        spyOn(localStorage, 'getItem').andCallFake(function(key) {
            return store[key];
        });
        spyOn(localStorage, 'setItem').andCallFake(function(key, value) {
            store[key] = value;
        });
    });

    afterEach(function() {
        store = {};
    });

    function sessionFactory(_session) {
        // Creates a fake session object for testing.
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

    it('can do a simple get', function() {
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

    it('can do a simple add', function() {
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

    it('can do a simple delete', function() {
        inject(function(SessionService) {
            SessionService.add(sessionFactory());
            expect(SessionService.get().length).toEqual(1);
            SessionService.del(SessionService.get()[0].id);
            expect(SessionService.get().length).toEqual(0);
        });
    });
});
