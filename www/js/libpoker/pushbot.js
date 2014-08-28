var _ = require('underscore');

var handsVsCommonRangesTable = require('./files/hand_vs_common_ranges_table.json');
var utils = require('./utils');


function calcPushbotRange(stack, bb, ante, players, callRangePct) {
    /*
        Given stack, pot, players to act, and the range% at which players will
        call, calcPushbotRange will return the range of hands that can be
        shoved profitably (cEV).

        For each hand, we use the basic EV formula:

            EV = (%everyoneFolds * (pot + stack)) +
                 (%someoneCalls * equityVsRange * (stack * 2 + pot))

        and push it to an array if EV > current stack.
    */
    stack = parseInt(stack, 10);
    bb = parseInt(bb, 10);
    var antes = parseInt(ante || 0, 10) * 10;
    var pot = bb * 1.5 + antes;

    // Probability of someone calling is
    //     = 1 - probability of no one calling.
    //     = 1 - fold ^ players.
    var foldPct = 1 - callRangePct / 100;
    var callPct = 1 - Math.pow(foldPct, players);

    // Calculate EV if everyone folds.
    var evEveryoneFolds = (1 - callPct) * (stack + pot);

    // For each hand, calculate EV if someone calls.
    var profitableHands = [];
    var hands = Object.keys(handsVsCommonRangesTable);
    _.each(hands, function(hand) {
        var equity = parseFloat(handsVsCommonRangesTable[hand][callRangePct]) / 100;
        var evSomeoneCalls = callPct * equity * (pot + stack * 2);

        // Get total EV and check if it is profitable.
        if (evEveryoneFolds + evSomeoneCalls > stack) {
            profitableHands.push(hand);
        }
    });
    return profitableHands;
}

module.exports = {
    calcPushbotRange: calcPushbotRange
};
