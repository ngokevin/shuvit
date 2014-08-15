var Modernizr = require('modernizr');
var $ = require('jquery');
var _ = require('underscore');
var chart = require('./chart');
require('./picker');
require('./picker.date');
var settings = require('./settings');

angular.module('shuvit.controllers', [])

.controller('TrackerCtrl', ['$scope', 'SessionService', function($scope, SessionService) {
    var currentChart;
    $scope.rangeDays = 365;

    SessionService.promise.then(function() {
        $scope.sessions = SessionService.get();

        currentChart = chart.CumulativeLineChart('.chart', $scope.sessions, {
            xAxis: {
                days: $scope.rangeDays
            },
            yAxis: {
                field: 'cumulativeProfit',
            }
        });

        $scope.$apply();
    });

    window.onresize = _.debounce(function() {
        // Resize the chart if viewport changes.
        if (currentChart) {
            currentChart.refresh($scope.sessions);
        }
    }, 100);
}])

.controller('SessionAddCtrl', ['$scope', '$state', 'SessionService',
    function($scope, $state, SessionService) {
    $scope.session = {
        date: null,
        buyin: null,
        cash: null,
        notes: null,
        result: null,
        title: null
    };

    // Set up date picker.
    var picker = $('.datepicker').pickadate({
        'onSet': function(value) {
            $scope.session.date = value.select;
            $scope.$$phase || $scope.$apply();
        }
    });
    picker.pickadate('picker').set('select', new Date().valueOf());

    // Check form validity.
    $scope.$watch('[session.date, session.buyin, session.result]', function() {
        $scope.session.valid = $scope.session.date &&
                               ($scope.session.buyin || $scope.session.buyin === 0)  &&
                               ($scope.session.result || $scope.session.result === 0);
    }, true);

    // Add session using service.
    $scope.addSession = function() {
        if (SessionService.add($scope.session)) {
            $state.go('tab.tracker');
        }
    };
}])

.controller('SessionListCtrl', ['$scope', 'SessionService',
    function($scope, SessionService) {
    $scope.sessions = SessionService.get();

    $scope.deleteSession = function(i) {
        var id = $scope.sessions[i].id;
        SessionService.del(id);
        $scope.sessions.splice(i, 1);
    };
}])

.controller('SessionDetailCtrl', ['$scope', '$stateParams', 'SessionService',
    function($scope, $stateParams, SessionService) {
    var sessions = SessionService.get();

    var sessionId = $stateParams.sessionId;
    $scope.session = _.filter(sessions, function(session) {
        return session.id == sessionId;
    })[0];
}])

.controller('ToolsCtrl', function($scope) {
})

.controller('SettingsCtrl',
    ['$ionicModal', '$scope', 'DropboxService',
    function($ionicModal, $scope, DropboxService) {
    var client = DropboxService.client;

    $scope.dropboxAuthenticated = client.isAuthenticated();

    $scope.linkDropbox = function() {
        if (client.isAuthenticated()) {
            return;
        }

        client.authenticate({interactive: true}, function(error) {
            if (error) {
                console.log('Authentication error: ' + error);
            }

            if (client.isAuthenticated()) {
                // Client is authenticated. Display UI.
                $scope.dropboxAuthenticated = true;
                $scope.$apply();
                localStorage.setItem('token', client._oauth._token);
            }
        });
    };
}])


.controller('RawDataCtrl', ['$scope', function($scope) {
    $scope.rawData = JSON.stringify(localStorage);
}])

.controller('ClearAllDataCtrl',
    ['$scope', '$state', 'SessionService',
    function($scope, $state, SessionService) {
    $scope.clearAllData = function() {
        localStorage.clear();
        SessionService.clear();
        $state.go('tab.settings');
    };
    $scope.cancelClearAllData = function() {
        $state.go('tab.settings');
    };
}]);
