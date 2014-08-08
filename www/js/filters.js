angular.module('shuvit.filters', [])

.filter('abs', function() {
   return function(val) {
       return Math.abs(val);
   };
})

.filter('profit', function() {
    return function(val) {
        var sign = val >= 0 ? '+' : '-';
        return sign + '$' + Math.abs(val);
    };
});
