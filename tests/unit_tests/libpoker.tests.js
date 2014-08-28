var LibpokerUtils = require('../../www/js/libpoker/utils');


describe('libpoker.utils.flattenRange', function() {
    it('can flatten paired range', function() {
        var range = LibpokerUtils.flattenRange(['QQ', 'KK', 'AA']);
        console.log(range);
    });
});
