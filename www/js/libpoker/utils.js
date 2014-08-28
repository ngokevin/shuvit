var _ = require('underscore');


function flattenRange(hands) {
    /* Takes a range of hands (strings) in the format of "AKo" where A is the
       high card, K is the low card, and o indicating offsuit, and returns
       a single string indicating the hand range.

       e.g., [AA, KK, QQ] => 'QQ+'
       e.g., [AK, AKo, AQ, AQo, AJ] => ['AQo+, AJ+']
    */
    var pairedRange = '';  // Only one minimum hand.
    var suitedRanges = [];
    var offsuitedRanges = [];
    for (var i = 0; i < 13; i++) {
        suitedRanges.push('');
        offsuitedRanges.push('');
    }

    var ranks = {
        '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
        'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
    };
    function getIndex(hand) {
        // Gets the index of the hand in the magical array of minimum ranges.
        var i = ranks[hand[0]] - 2;

        if (hand.length === 3) {
            return offsuitedRanges[i];
        } else if (hand[0] == hand[1]) {
            return pairedRange;
        } else {
            return suitedRanges[i];
        }
    }

    _.each(hands, function(hand) {
    });
}

module.exports = {
    flattenRange: flattenRange
};
