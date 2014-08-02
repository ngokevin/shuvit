var gulp = require('gulp');
var browserify = require('browserify');
var concat = require('gulp-concat');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');

var paths = {
    app_js: ['./www/js/app.js'],
    css: ['./www/css/**/*.css'],
    scss: ['./www/css/**/*.scss'],
    ionic_scss: ['./scss/**/*.scss', './www/lib/ionic/scss/**/*.scss'],
    img: ['www/img/**/*'],
    js: ['www/js/*.js'],
};

gulp.task('ionic_css', function(done) {
    return gulp.src(paths.ionic_scss)
        .pipe(sass())
        .pipe(rename('bundle.css'))
        .pipe(gulp.dest('./www/build/'));
});

gulp.task('scss', function(done) {
    return gulp.src(paths.scss)
        .pipe(sass({
            sourceMap: 'sass',
            sourceComments: 'map'
        }))
        .pipe(gulp.dest('./www/css/'));
});

gulp.task('css', ['ionic_css', 'scss'], function(done) {
    gulp.src(paths.css.concat(['./www/build/bundle.css']))
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest('./www/build/'))
        .pipe(minifyCss({
            keepSpecialComments: 0
        }))
        .pipe(rename({extname: '.min.css'}))
        .pipe(gulp.dest('./www/build/'))
        .end(done);
});

gulp.task('js', function() {
    // Browserify/bundle the JS.
    browserify(paths.app_js)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./www/build/'));
});

// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch(paths.scss, ['css']);
    gulp.watch(paths.ionic_css, ['css']);
    gulp.watch(paths.js, ['js']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'css', 'js']);
