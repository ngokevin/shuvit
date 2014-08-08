var $ = require('jquery');
var settings_local = require('./settings_local.js');

var exports = {
    title: 'Live Poker Pro'
};

$.extend(true, exports, settings_local);
module.exports = exports;
