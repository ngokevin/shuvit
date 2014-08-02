var Modernizr = require('modernizr');
var _ = require('underscore');
var chart = require('./chart');

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

.controller('AddSessionCtrl', function($scope) {
    $scope.dateSupport = Modernizr.inputtypes.date;
})

.controller('ToolsCtrl', function($scope) {
})

.controller('SettingsCtrl', function($scope) {
});
