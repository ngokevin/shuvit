var _ = require('underscore');
var handsVsCommonRangesTable = require('./files/hand_vs_common_ranges_table.json');

function calcPushbotRange(stack, bb, ante, players, callRangePct) {
    /*
        Given stack, pot, players to act, and the range% at which players will
        call, calcPushbotRange will return the range of hands that can be
        shoved profitably.

        For each hand, we use the EV formula:

            EV = ((1 - callRangePct) * pot) +
                 (callRangePct * equityVs(callRangePct) * stack * 2)

        and push it to an array if EV > current stack.
    */
    console.log('Calculating push range.');

    var profitableHands = [];
    var pot = bb * 1.5 + (ante || 0) * 10;

    // Probability of someone calling is
    //     = 1 - probability of no one calling.
    //     = 1 - fold ^ players.
    var foldPct = 1 - callRangePct / 100;
    var callPct = 1 - Math.pow(foldPct, players);

    // Calculate EV if everyone folds.
    var profitFold = (1 - callPct) * pot;

    var hands = Object.keys(handsVsCommonRangesTable);
    _.each(hands, function(hand) {
        // For each hand, calculate EV if called and win.
        var equity = parseFloat(handsVsCommonRangesTable[hand][callRangePct]) / 100;
        var profitCall = callPct * equity * stack * 2;

        if (profitFold + profitCall > stack) {
            profitableHands.push(hand);
        }
    });

    console.log('Finished calculating push range.');
    return profitableHands;
}

module.exports = {
    calcPushbotRange: calcPushbotRange
};
