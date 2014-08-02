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
                sessions = [
                    {id: 0, date: new Date(2014, 7, 31), buyin: 50, result: 500},
                    {id: 1, date: new Date(2014, 8, 1), buyin: 40, result: 0},
                    {id: 2, date: new Date(2014, 8, 2), buyin: 60, result: 350}
                ];
            }
            return transform(sessions);
        },

        add: function(date, buyin, result, cash, location, notes) {
            /* Add a session.
             * date -- in milliseconds
             * buyin -- integer, how much they bought in with
             * result -- integer, how much they came out with including buyin
             * cash -- cash vs tournmanet, boolean
             * location -- name/place they played, string
             * notes -- miscellaneous notes, string
             */
            if (!(date && buyin >= 0 && result >= 0)) {
                // Validate.
                return;
            }

            sessions.push({
                id: sessions.length,
                date: date,
                buyin: buyin,
                result: result,
                cash: cash || false,
                location: location,
                notes: notes
            });
            sessions = _.sortBy(sessions, function(_session) {
                return _session.data;
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

    function transform(data) {
        // Attach helper data.
        var cumulativeProfit = 0;
        return _.map(data, function(d) {
            // Calculate profits.
            cumulativeProfit += (d.result - d.buyin);
            d.cumulativeProfit = cumulativeProfit;
            return d;
        });
    }

    function deserialize(sessions) {
        // From LS.
        sessions = JSON.parse(sessions);
        return _.map(sessions, function(session) {
            session.date = new Date(session.date);
            return session;
        });
    }

    function serialize(sessions) {
        // To LS.
        sessions = _.extend([], sessions);
        return JSON.stringify(_.map(sessions, function(session) {
            session.date = Date.parse(session.date);
            return session;
        }));
    }

    function save() {
        localStorage.setItem('sessions', serialize(sessions));
    }
});
