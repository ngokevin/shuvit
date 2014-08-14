var $ = require('jquery');

describe('SessionService', function() {
    var ls_store = {};
    var data_store = {};

    var ls = function() {
        return JSON.parse(store.storage);
    };

    beforeEach(function() {
        // setUp.

        // Browserify does not allow angular-mocks set window.module.
        window.angular.mock.module('shuvit');

        // LocalStorage mock.
        spyOn(localStorage, 'getItem').andCallFake(function(key) {
            return ls_store[key];
        });
        Object.defineProperty(localStorage, 'setItem', {writable: true});
        spyOn(localStorage, 'setItem').andCallFake(function(key, value) {
            ls_store[key] = value;
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
        return $.extend(true, session, _session)
    }

    it('can get (mock)', function() {
        inject(function(SessionService) {
            expect(SessionService.get(true)).toEqual(jasmine.any(Object));
        });
    });
});
