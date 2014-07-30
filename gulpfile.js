var gulp = require('gulp');

var browserify = require('browserify');
var del = require('del');
// var imagemin = require('gulp-imagemin');
var source = require('vinyl-source-stream');

var paths = {
    scripts: ['src/js/**/*'],
    images: 'src/img/**/*'
};

// Not all tasks need to use streams
// A gulpfile is just another node program and you can use all packages available on npm
gulp.task('clean', function(cb) {
    // You can use multiple globbing patterns as you would with `gulp.src`
    del(['build'], cb);
});

gulp.task('scripts', ['clean'], function() {
    // Bundle the JS.
    browserify('./src/js/index.js').bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./src/'));
});

// Copy all static images
gulp.task('images', ['clean'], function() {
    return gulp.src(paths.images)
        // Pass in options to the task
        .pipe(imagemin({optimizationLevel: 5}))
        .pipe(gulp.dest('build/img'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch(paths.scripts, ['scripts']);
    // gulp.watch(paths.images, ['images']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'scripts']);
