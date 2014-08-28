var _ = require('underscore');


var RANKS = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
    'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};


function getType(hand) {
    // Return suited, pair, or offsuit.
    if (hand.length === 3) {
        return 'offsuit';
    } else if (hand[0] == hand[1]) {
        return 'pair';
    } else {
        return 'suited';
    }
}


function compareHands(handA, handB) {
    /* Compares two-card hands.
       Returns -1 if A < B.
       Returns 0 if A < B.
       Returns 1 if A < B or if B is empty.
    */
    if (!handB) {
        return 1;
    }
    if (handA == handB) {
        return 0;
    }
    for (var i = 0; i < 2; i++) {
        if (RANK[handA[i]] < RANK[handB[i]]) {
            return -1;
        } else if (RANK[handA[i]] > RANK[handB[i]]) {
            return 1;
        }
    }
}


function flattenRange(hands) {
    /* Takes a range of hands (strings) in the format of "AKo" where A is the
       high card, K is the low card, and o indicating offsuit, and returns
       a single string indicating the hand range.

       e.g., [AA, KK, QQ] => 'QQ+'
       e.g., [AK, AKo, AQ, AQo, AJ] => ['AQo+, AJ+']
    */
    var pairedRange = [''];  // Will only contain one hand.
    var suitedRanges = [];
    var offsuitedRanges = [];
    for (var i = 0; i < 13; i++) {
        suitedRanges.push('');
        offsuitedRanges.push('');
    }

    var ranges = {
        'offsuit': offsuitedRanges,
        'pair': pairedRange,
        'suited': suitedRanges,
    };

    _.each(hands, function(hand) {
        // Paired ranges are always one-size. Regular ranges are indexed.
        var type = getType(hand);
        var i = type == 'pair' ? 0 : RANKS[hand[0]] - 2;

        // Set the better hand in the range.
        ranges[type][i] = compareHands(hand, ranges[type][i]) > 0 ? handA : handB;
    });

    return ranges;
}

module.exports = {
    flattenRange: flattenRange
};
