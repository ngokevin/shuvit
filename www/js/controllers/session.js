var Modernizr = require('modernizr');
var $ = require('jquery');
var _ = require('underscore');
var chart = require('../chart');
require('../picker');
require('../picker.date');
var settings = require('../settings');


function BaseSessionAddCtrl($rootScope, $scope, $state, SessionService) {
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

            if (!$scope.update) {
                // Don't want to set this when we're just updating.
                $rootScope.lastPickedDate = value.select;
            }
        }
    });
    var initialDate = $scope.update ? new Date().valueOf() :
                                      $rootScope.lastPickedDate ||
                                      new Date().valueOf();
    picker.pickadate('picker').set('select', initialDate);
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


angular.module('shuvit.controllers.session', [])

.controller('TrackerCtrl',
    ['$rootScope', '$scope', 'PubSubService', 'SessionService',
    function($rootScope, $scope, PubSubService, SessionService) {
    var currentChart = chart.CumulativeLineChart('.chart', SessionService.get(), {
        xAxis: {
            days: -1
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

.controller('ChartFiltersCtrl', ['$scope', function($scope) {
    $scope.filters = {
        startDate: null,
        endDate: null,
    };

    var initialStartDate;
    var initialEndDate;

    // Set date pickers.
    $('.datepicker-start').pickadate({
        'onSet': function(value) {
            $scope.filters.startDate = value.select;
            $scope.$$phase || $scope.$apply();
        }
    });
    $('.datepicker-end').pickadate({
        'onSet': function(value) {
            $scope.filters.endDate = value.select;
            $scope.$$phase || $scope.$apply();
        }
    });
}])

.controller('StatsCtrl', ['$scope', 'StatsService', function($scope, StatsService) {
    $scope.stats = {
        avgBuyin: StatsService.avgBuyin(),
        avgResult: StatsService.avgResult(),
        buyins: StatsService.buyins(),
        itm: StatsService.itm(),
        numSessions: StatsService.numSessions(),
        roi: StatsService.roi(),
        results: StatsService.results(),
        profit: StatsService.profit()
    };
}])

.controller('SessionAddCtrl',
    ['$rootScope', '$scope', '$state', 'SessionService',
    function($rootScope, $scope, $state, SessionService) {
    $scope.update = false;

    BaseSessionAddCtrl.call(this, $rootScope, $scope, $state, SessionService);
}])

.controller('SessionUpdateCtrl',
    ['$rootScope', '$scope', '$state', '$stateParams', 'SessionService',
    function($rootScope, $scope, $state, $stateParams, SessionService) {
    $scope.update = true;  // Flag that we're on the update view

    BaseSessionAddCtrl.call(this, $rootScope, $scope, $state, SessionService);

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

    $scope.deleteSession = function(id) {
        SessionService.del(id);
        $scope.sessions = SessionService.get();
    };

    $scope.updateSession = function(id) {
        $state.go('tab.session_update', {sessionId: id});
    };
}])

.controller('SessionDetailCtrl', ['$scope', '$stateParams', 'SessionService',
    function($scope, $stateParams, SessionService) {
    var sessions = SessionService.get();

    var sessionId = $stateParams.sessionId;
    $scope.session = _.filter(sessions, function(session) {
        return session.id == sessionId;
    })[0];
}]);
