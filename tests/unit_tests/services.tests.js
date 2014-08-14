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

    afterEach(function () {
        store = {};
    });

    function sessionFactory(_session) {
        var session = {
            id: new Date().getTime(),
            buyin: 100,
            cash: false,
            date: new Date().getTime(),
            notes: 'ngokevin.com',
            result: 200,
            title: 'ngokevin.com'
        };
        return $.extend(true, session, _session);
    }

    it('can get (mock)', function() {
        inject(function(SessionService) {
            expect(SessionService.get(true)).toEqual(jasmine.any(Object));
        });
    });

    it('can get', function() {
        var session = sessionFactory();
        store.sessions = JSON.stringify([session]);

        inject(function(SessionService) {
            expect(SessionService.get()[0].id).toEqual(session.id);
        });
    });
});
