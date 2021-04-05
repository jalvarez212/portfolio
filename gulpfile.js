var gulp = require('gulp');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var watch = require('gulp-watch');
var browserSync = require('browser-sync');
var gutil = require('gulp-util');

var spawn = require('child_process').spawn;

gulp.task('serve', function() {
  browserSync.init({
    // files: ['**'],
    port: 4000,
    server: {
      baseDir: '.'
    },
    notify: false,
    reloadDelay: 1000
  });

  gulp.watch(['sass/*.scss'], function(event) {
    // gutil.log('gulp: ' + event.path);
    gulp.src(event.path)
      .pipe(sourcemaps.init())
      .pipe(sass({ includePaths: 'bower_components/' }).on('error', sass.logError))
      .pipe(sourcemaps.write())
      .pipe(gulp.dest('static/css/'))
      .pipe(browserSync.stream());
  });

  gulp.watch(["*.html"]).on('change', browserSync.reload);

});


gulp.task('css', function() {
  gulp.src(['sass/*.scss'])
    .pipe(sourcemaps.init())
    .pipe(sass({ includePaths: 'bower_components/' }).on('error', sass.logError))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('static/css/'));
})

gulp.task('default', ['css', 'serve']);