var gulp = require('gulp');

var browserify = require('browserify');
var del = require('del');
// var imagemin = require('gulp-imagemin');
var reactify = require('reactify');
var source = require('vinyl-source-stream');
var stylus = require('gulp-stylus');

var paths = {
    css: ['src/css/**/*.styl'],
    img: ['src/img/**/*'],
    index_js: ['./src/js/index.jsx'],
    js: ['src/js/*.js'],
};

// A gulpfile is just another node program and you can use all packages available on npm.
gulp.task('clean', function(cb) {
    // You can use multiple globbing patterns as you would with `gulp.src`.
    del(['build'], cb);
});

gulp.task('css', ['clean'], function() {
    return gulp.src(paths.css)
        .pipe(stylus())
        .pipe(gulp.dest('./src/css'));
});

gulp.task('img', ['clean'], function() {
    return gulp.src(paths.img)
        // Pass in options to the task
        .pipe(imagemin({optimizationLevel: 5}))
        .pipe(gulp.dest('build/img'));
});

gulp.task('js', ['clean'], function() {
    // Browserify/bundle the JS.
    browserify(paths.index_js)
        .transform(reactify)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./src/'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch(paths.css, ['css']);
    gulp.watch(paths.js, ['js']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'css', 'js']);
