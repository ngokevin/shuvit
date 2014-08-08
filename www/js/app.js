var angular = require('angular');
var $ = require('jquery');
window.jQuery = $;

require('angular-animate');
require('angular-ui-router');
require('./controllers');
require('./filters');
require('./services');
require('./settings');

angular.module('shuvit', ['ionic', 'shuvit.controllers',
                          'shuvit.filters', 'shuvit.services'])

.run(['$ionicPlatform', function($ionicPlatform) {
    $ionicPlatform.ready(function() {
        // Hide the accessory bar by default.
        if(window.cordova && window.cordova.plugins.Keyboard) {
            cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
        }
        if(window.StatusBar) {
            // org.apache.cordova.statusbar required.
            StatusBar.styleDefault();
        }
    });
}])

.config(['$stateProvider', '$urlRouterProvider', function($stateProvider, $urlRouterProvider) {
    // AngularUI Router.
    $stateProvider
        // Set up an abstract state for the tabs directive.
        .state('tab', {
            url: "/tab",
            abstract: true,
            templateUrl: "templates/tabs.html"
        })

        // Each tab has its own nav history stack:
        .state('tab.tracker', {
            url: '/tracker',
            views: {
                'tracker': {
                    templateUrl: 'templates/tracker.html',
                    controller: 'TrackerCtrl'
                }
            }
        })

        .state('tab.session_add', {
            url: '/session/add',
            views: {
                'tracker': {
                    templateUrl: 'templates/session/add.html',
                    controller: 'SessionAddCtrl'
                }
            }
        })

        .state('tab.session_list', {
            url: '/session/list',
            views: {
                'tracker': {
                    templateUrl: 'templates/session/list.html',
                    controller: 'SessionListCtrl'
                }
            }
        })

        .state('tab.session_detail', {
            url: '^/tab/session/{sessionId:[0-9]}',
            views: {
                'tracker': {
                    templateUrl: 'templates/session/detail.html',
                    controller: 'SessionDetailCtrl'
                }
            }
        })

        .state('tab.tools', {
            url: '/tools',
            views: {
                'tools': {
                    templateUrl: 'templates/tools.html',
                    controller: 'ToolsCtrl'
                }
            }
        })

        .state('tab.settings', {
            url: '/settings',
            views: {
                'settings': {
                    templateUrl: 'templates/settings.html',
                    controller: 'SettingsCtrl'
                }
            }
        });

    $urlRouterProvider.otherwise('/tab/tracker');
    window.location.href = window.location.pathname + '#/tab/tracker';
}]);
