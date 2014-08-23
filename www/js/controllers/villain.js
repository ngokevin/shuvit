var $ = require('jquery');
var _ = require('underscore');
var settings = require('../settings');

function BaseVillainAddCtrl($rootScope, $scope, $state, VillainService) {
    /* Base controller for add and update villain views. */
    $scope.villain = {
        name: null,
        description: null,
        style: null,
        notes: null,
        history: null
    };

    // Check form validity.
    $scope.$watch('[villain.name]', function() {
        $scope.villain.valid = $scope.villain.name;
    }, true);

    // Add villain using service.
    $scope.saveVillain = function() {
        if (VillainService.add($scope.villain)) {
            $state.go('tab.villain_list');
        }
    };
}

angular.module('shuvit.controllers.villain', [])

.controller('VillainAddCtrl',
    ['$rootScope', '$scope', '$state', 'VillainService',
    function($rootScope, $scope, $state, VillainService) {
    $scope.update = false;

    BaseVillainAddCtrl.call(this, $rootScope, $scope, $state, VillainService);
}])

.controller('VillainUpdateCtrl',
    ['$rootScope', '$scope', '$state', '$stateParams', 'VillainService',
    function($rootScope, $scope, $state, $stateParams, VillainService) {
    $scope.update = true;  // Flag that we're on the update view

    BaseVillainAddCtrl.call(this, $rootScope, $scope, $state, VillainService);

    // Fetch villain.
    var villains = VillainService.get();
    var villain = _.filter(villains, function(villain) {
        return villain.id == $stateParams.villainId;
    })[0];

    // Set values in the template.
    $scope.villain = {
        id: villain.id,  // Needed for update since we do a delete + add.
        name: villain.name,
        description: villain.description,
        style: villain.style,
        notes: villain.notes,
        history: villain.history
    };

    // Update villain using service.
    $scope.saveVillain = function() {
        if (VillainService.update($scope.villain)) {
            $state.go('tab.villain_list');
        }
    };
}])

.controller('VillainListCtrl', ['$scope', '$state', 'VillainService',
    function($scope, $state, VillainService) {
    $scope.villains = VillainService.get();

    $scope.deleteVillain = function(id) {
        VillainService.del(id);
        $scope.villains = VillainService.get();
    };

    $scope.updateVillain = function(id) {
        $state.go('tab.villain_update', {villainId: id});
    };
}])

.controller('VillainDetailCtrl', ['$scope', '$stateParams', 'VillainService',
    function($scope, $stateParams, VillainService) {
    var villains = VillainService.get();

    var villainId = $stateParams.villainId;
    $scope.villain = _.filter(villains, function(villain) {
        return villain.id == villainId;
    })[0];
}]);
