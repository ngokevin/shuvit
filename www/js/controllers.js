var Modernizr = require('modernizr');
var $ = require('jquery');
var _ = require('underscore');
var chart = require('./chart');
require('./picker');
require('./picker.date');

angular.module('sidekick.controllers', [])

.controller('TrackerCtrl', ['$scope', 'SessionService', function($scope, SessionService) {
    $scope.sessions = SessionService.get(true);
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
    // Set up date picker.
    $scope.dateSupport = Modernizr.inputtypes.date;
    if (!$scope.dateSupport) {
        var picker = $('.datepicker').pickadate({
            'onSet': function(value) {
                $scope.$apply(function() {
                    $scope.date = value.select;
                });
            }
        });
    }

    // Add session using service.
    $scope.addSession = function() {
        if (SessionService.add($scope.date, $scope.buyin, $scope.result,
                               $scope.cash, $scope.location, $scope.notes)) {
            $state.go('tab.tracker');
        }
    };
}])

.controller('ToolsCtrl', function($scope) {
})

.controller('SettingsCtrl', function($scope) {
});
