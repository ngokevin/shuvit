var $ = require('jquery');
var _ = require('underscore');

angular.module('sidekick.services', [])

.service('SessionService', function() {
    // Session => {id, start, buyin, profit, hours, location, entrants, place, notes}
    var sessions = [];
    if (localStorage.getItem('sessions')) {
        sessions = deserialize(localStorage.getItem('sessions'));
    } else {
        save();
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
             * location -- name/place they played, string
             * notes -- miscellaneous notes, string
             * result -- integer, how much they came out with including buyin
             */
            if (!(session.date && session.buyin >= 0 && session.result >= 0)) {
                // Validate.
                return;
            }

            // Build the object.
            sessions.push({
                id: sessions.length,
                buyin: parseInt(session.buyin, 10),
                cash: session.cash || false,
                date: session.date,
                location: session.location,
                notes: session.notes,
                result: parseInt(session.result, 10),
            });

            sessions = _.sortBy(sessions, function(_session) {
                return _session.date;
            });

            save();
            return true;
        },

        del: function(session) {
            sessions = _.reject(sessions, function(_session) {
                return _session.id == session.id;
            });
            save();
        },
    };

    function transform(_sessions) {
        _sessions = $.extend(true, {}, _sessions);

        // Attach helper data.
        var cumulativeProfit = 0;
        _sessions = _.map(_sessions, function(d) {
            // Calculate profits.
            cumulativeProfit += (d.result - d.buyin);
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
});
