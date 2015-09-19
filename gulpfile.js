const gulp = require('gulp');
const jshint = require('gulp-jshint');

gulp.task('jshint', function() {
  return gulp.src(['lib/*.js', './app.js', './config.js'])
    .pipe(jshint({
      predef: ['require', 'module', 'localRequire'],
      node: true,
      esnext: true
    }))
    .pipe(jshint.reporter('default'));
});


gulp.task('default', ['jshint']);
