const gulp = require('gulp');
const jshint = require('gulp-jshint');
const mocha = require('gulp-mocha');
const istanbul = require('gulp-istanbul');

gulp.task('jshint', function() {
  return gulp.src(['transport/*.js', './config.js'])
    .pipe(jshint({
      predef: ['require', 'module', 'localRequire'],
      node: true,
      esnext: true
    }))
    .pipe(jshint.reporter('default'));
});


gulp.task('test', function(cb) {
  gulp.src(['./transport/*.js', './lib/*.js'])
    .pipe(istanbul())
    .pipe(istanbul.hookRequire())
    .on('finish', function() {
      gulp.src(['./test/*.js'])
        .pipe(mocha({
          reporter: 'spec'
        }))
        .pipe(istanbul.writeReports({
          reporters: ['text', 'text-summary', 'html']
        }))
        .pipe(istanbul.enforceThresholds({
          thresholds: {
            global: 90
          }
        })).on('end', cb);
    });
});

gulp.task('default', ['jshint']);
