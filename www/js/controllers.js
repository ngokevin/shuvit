var Modernizr = require('modernizr');
var $ = require('jquery');
var _ = require('underscore');
var chart = require('./chart');
require('./picker');
require('./picker.date');
var settings = require('./settings');

function BaseSessionAddCtrl($scope, $state, SessionService) {
    /* Base controller for add and update session views. */
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
    $scope.picker = picker;

    // Check form validity.
    $scope.$watch('[session.date, session.buyin, session.result]', function() {
        $scope.session.valid = $scope.session.date &&
                               ($scope.session.buyin || $scope.session.buyin === 0)  &&
                               ($scope.session.result || $scope.session.result === 0);
    }, true);

    // Add session using service.
    $scope.saveSession = function() {
        if (SessionService.add($scope.session)) {
            $state.go('tab.tracker');
        }
    };
}

angular.module('shuvit.controllers', [])

.controller('TrackerCtrl',
    ['$rootScope', '$scope', 'PubSubService', 'SessionService',
    function($rootScope, $scope, PubSubService, SessionService) {
    var currentChart = chart.CumulativeLineChart('.chart', SessionService.get(), {
        xAxis: {
            days: 365
        },
        yAxis: {
            field: 'cumulativeProfit',
        }
    });

    PubSubService.subscribe('session-promise', function(sessions) {
        // When the data is ready, render the chart.
        refreshChart();
    });

    function refreshChart() {
        currentChart.refresh(SessionService.get());
    }

    window.onresize = _.debounce(refreshChart, 100);
}])

.controller('SessionAddCtrl', ['$scope', '$state', 'SessionService',
    function($scope, $state, SessionService) {
    BaseSessionAddCtrl.call(this, $scope, $state, SessionService);
}])

.controller('SessionUpdateCtrl',
    ['$scope', '$state', '$stateParams', 'SessionService',
    function($scope, $state, $stateParams, SessionService) {
    // Inherits from SessionAddCtrl.
    BaseSessionAddCtrl.call(this, $scope, $state, SessionService);

    // Fetch session.
    var sessions = SessionService.get();
    var session = _.filter(sessions, function(session) {
        return session.id == $stateParams.sessionId;
    })[0];

    // Set values in the template.
    $scope.session = {
        id: session.id,  // Needed for update since we do a delete + add.
        date: session.date,
        buyin: session.buyin,
        cash: session.cash,
        notes: session.notes,
        result: session.result,
        title: session.title
    };

    // Set the picker date.
    $scope.picker.pickadate('picker').set('select', session.date);

    // Flag that we're on the update view since we share add.html template.
    $scope.update = true;

    // Update session using service.
    $scope.saveSession = function() {
        if (SessionService.update($scope.session)) {
            $state.go('tab.session_list');
        }
    };
}])

.controller('SessionListCtrl', ['$scope', '$state', 'SessionService',
    function($scope, $state, SessionService) {
    $scope.sessions = SessionService.get();

    $scope.deleteSession = function(i) {
        var id = $scope.sessions[i].id;
        SessionService.del(id);
        $scope.sessions = SessionService.get();
    };

    $scope.updateSession = function(i) {
        $state.go('tab.session_update', {sessionId: $scope.sessions[i].id});
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
