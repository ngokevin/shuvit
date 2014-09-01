var LibpokerUtils = require('../../www/js/libpoker/utils');


describe('libpoker.utils.flattenRange', function() {
    it('can flatten offsuit range', function() {
        expect(LibpokerUtils.flattenRange(['AJo', 'AQo', 'AKo'])).toEqual('AJo+');
        expect(LibpokerUtils.flattenRange(['AQo', 'AKo'])).toEqual('AQo+');
        expect(LibpokerUtils.flattenRange(['AKo'])).toEqual('AKo');
    });

    it('can flatten paired range', function() {
        expect(LibpokerUtils.flattenRange(['QQ', 'KK', 'AA'])).toEqual('QQ+');
        expect(LibpokerUtils.flattenRange(['KK', 'AA'])).toEqual('KK+');
        expect(LibpokerUtils.flattenRange(['AA'])).toEqual('AA');
    });

    it('can flatten suited range', function() {
        expect(LibpokerUtils.flattenRange(['J8', 'J9', 'JT'])).toEqual('J8+');
        expect(LibpokerUtils.flattenRange(['J9', 'JT'])).toEqual('J9+');
        expect(LibpokerUtils.flattenRange(['JT'])).toEqual('JT');
    });

    it('can flatten entire range', function() {
        var range = ['JTo', 'J9o', 'AA', 'JT', 'KK', 'J9'];
        var expected = 'KK+, J9+, J9o+';
        expect(LibpokerUtils.flattenRange(range)).toEqual(expected);
    });
});
