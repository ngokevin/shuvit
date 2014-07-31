var angular = require('angular');
require('angular-ui-router');
require('./controllers');
require('./services');
require('./settings');

angular.module('sidekick', ['ionic', 'sidekick.controllers',
                            'sidekick.services'])

.run(function($ionicPlatform) {
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
})

.config(function($stateProvider, $urlRouterProvider) {
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
    })

  $urlRouterProvider.otherwise('/tab/tracker');
});

