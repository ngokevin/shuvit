var $ = require('jquery');
var settings_local = require('./settings_local.js');

var exports = {
    title: 'Live Poker Pro',
    cordova: document.URL.indexOf('http://') === -1 &&
             document.URL.indexOf('https://') === -1,

};

$.extend(true, exports, settings_local);
module.exports = exports;
