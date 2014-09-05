var Modernizr = require('modernizr');
var $ = require('jquery');
var _ = require('underscore');
var chart = require('./chart');
require('./controllers/session');
require('./controllers/villain');
var PokerUtils = require('./libpoker/utils');
var Pushbot = require('./libpoker/pushbot');
require('./picker');
require('./picker.date');
require('./services');
var settings = require('./settings');

angular.module('shuvit.controllers', [
    'shuvit.controllers.session',
    'shuvit.controllers.villain'
])

.controller('ToolsCtrl', function($scope) {
})

.controller('PushbotCtrl', ['$scope', function($scope) {
    $scope.pushbot = {
        stack: null,
        bb: null,
        ante: null,
        players: 2,
        range: 20,
    };

    $scope.ENUMERATED_RANGES = PokerUtils.ENUMERATED_RANGES;

    function calculateM() {
        // M = stack / pot.
        if (!$scope.pushbot.stack || !$scope.pushbot.bb) {
            $scope.m = null;
            return;
        }
        $scope.m = ($scope.pushbot.stack /
                    ($scope.pushbot.bb * 1.5 + $scope.pushbot.ante * 10)).toFixed(2);
    }

    function calculatePushRange() {
        var pushbot = $scope.pushbot;
        if (pushbot.stack && pushbot.bb && pushbot.players) {
            $scope.range = Pushbot.calcPushbotRange(
                pushbot.stack, pushbot.bb, pushbot.ante, pushbot.players, 15);
            $scope.$apply();
        }
    }

    $scope.$watch('[pushbot.stack, pushbot.bb, pushbot.ante]', calculateM, true);
    $scope.$watch('[pushbot.stack, pushbot.bb, pushbot.ante, pushbot.players]',
                  _.debounce(calculatePushRange, 500), true);
}])

.controller('SettingsCtrl',
    ['$ionicModal', '$scope', 'DropboxService', 'PubSubService',
    function($ionicModal, $scope, DropboxService, PubSubService) {
    var client = DropboxService.getClient();

    $scope.dropboxAuthenticated = client.isAuthenticated();
    PubSubService.subscribe('dropbox-promise', function(promise) {
        client = DropboxService.getClient();
        $scope.dropboxAuthenticated = client.isAuthenticated();
        $scope.$apply();
    });

    $scope.linkDropbox = function() {
        if (client.isAuthenticated()) {
            return;
        }
        client.authenticate({interactive: true}, function(error) {
            if (error) {
                console.log('Authentication error: ' + error);
                return;
            }
            DropboxService.refresh();
            $scope.$apply();
        });
    };
}])

.controller('RawDataCtrl', ['$scope', function($scope) {
    $scope.rawData = JSON.stringify(localStorage);
}])

.controller('ClearAllDataCtrl',
    ['$scope', '$state', 'DropboxService', 'SessionService',
    function($scope, $state, DropboxService, SessionService) {
    $scope.clearAllData = function() {
        localStorage.clear();
        SessionService.clear();
        DropboxService.refresh();

        $state.go('tab.settings');
    };
    $scope.cancelClearAllData = function() {
        $state.go('tab.settings');
    };
}]);
