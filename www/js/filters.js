angular.module('sidekick.filters', [])

.filter('abs', function() {
   return function(val) {
       return Math.abs(val);
   };
});
