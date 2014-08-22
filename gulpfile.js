var del = require('del');
var gulp = require('gulp');
var browserify = require('browserify');
var concat = require('gulp-concat');
var exec = require('child_process').exec;
var fs = require('fs');
var minifyCss = require('gulp-minify-css');
var rename = require('gulp-rename');
var sass = require('gulp-sass');
var source = require('vinyl-source-stream');

var paths = {
    app_js: ['./www/js/app.js'],
    css: ['./www/css/**/*.css'],
    scss: ['./www/css/**/*.scss'],
    ionic_scss: ['./www/lib/ionic/css/**/*.scss',
                 './scss/**/*.scss'],
    img: ['./www/img/**/*'],
    js: ['./www/lib/ionic/js/ionic.bundle.min.js',
         './www/js/dropbox-datastores-1.1-latest.js'],  // Extra JS.
    watch_js: ['./www/js/*.js'],
};

gulp.task('clean_css', function(done) {
    del(['./www/build/*.css'], done);
});

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

gulp.task('css', ['clean_css', 'ionic_css', 'scss'], function(done) {
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

gulp.task('app_js', function() {
    // Browserify/bundle the main JS.
    return browserify(paths.app_js)
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(gulp.dest('./www/build/'));
});

gulp.task('js', ['app_js'], function(done) {
    // Tack on some other JS files to the main bundle.
    return gulp.src(['./www/build/bundle.js'].concat(paths.js))
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('./www/build/'));
});

gulp.task('ios', ['css', 'js'], function() {
    if (fs.existsSync('platforms/ios')) {
        exec('cordova prepare ios');
    }
});

// Rerun the task when a file changes
gulp.task('watch', function() {
    gulp.watch(paths.scss, ['css']);
    gulp.watch(paths.ionic_scss, ['css']);
    gulp.watch(paths.watch_js, ['js', 'ios']);
});

// The default task (called when you run `gulp` from cli)
gulp.task('default', ['watch', 'css', 'js', 'ios']);
