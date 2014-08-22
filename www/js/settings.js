var $ = require('jquery');
var settings_local = require('./settings_local.js');

var exports = {
    title: 'Poker Oven',
    cordova: document.URL.indexOf('http://') === -1 &&
             document.URL.indexOf('https://') === -1,
    dropboxKey: 'FAKE-KEY-FOR-TEST'
};

$.extend(true, exports, settings_local);
module.exports = exports;
