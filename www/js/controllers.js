var Modernizr = require('modernizr');
var $ = require('jquery');
var _ = require('underscore');
var chart = require('./chart');
require('./picker');
require('./picker.date');

angular.module('sidekick.controllers', [])

.controller('TrackerCtrl', ['$scope', 'SessionService', function($scope, SessionService) {
    $scope.sessions = SessionService.get();
    $scope.rangeDays = 365;

    var currentChart = chart.CumulativeLineChart('.chart', $scope.sessions, {
        xAxis: {
            days: $scope.rangeDays
        },
        yAxis: {
            field: 'cumulativeProfit',
        }
    });

    window.onresize = _.debounce(function() {
        // Resize the chart if viewport changes.
        currentChart.refresh($scope.sessions);
    }, 100);
}])

.controller('AddSessionCtrl', ['$scope', '$state', '$timeout', 'SessionService',
    function($scope, $state, $timeout, SessionService) {
    $scope.session = {
        date: null,
        buyin: null,
        result: null,
        location: null,
        cash: null,
        notes: null
    };

    // Set up date picker.
    $scope.dateSupport = Modernizr.inputtypes.date;
    if (!$scope.dateSupport) {
        var picker = $('.datepicker').pickadate({
            'onSet': function(value) {
                $scope.$apply(function() {
                    $scope.session.date = value.select;
                });
            }
        });
    }

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

.controller('ToolsCtrl', function($scope) {
})

.controller('SettingsCtrl', function($scope) {
});
