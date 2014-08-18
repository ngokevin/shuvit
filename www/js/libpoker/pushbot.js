var _ = require('underscore');

function calcPushbotRange(stack, bb, ante, players, callRangePct) {
    var callPct = Math.exp(callRangePct, players);

    var pot = bb * 1.5 + ante;
    var profitFold = (1 - callPct) * pot;

    var profitableHands = [];
    _.each(hands, function(hand) {
        // For each hand, calculate EV if called and win.
        var profitCall = callPct * handVsRange(callRangePct) * stack * 2;

        if (profitFold + profitCall > stack) {
            profitableHands.push(hand);
        }
    });

    return profitableHands;
}

module.exports = {

};
