var gulp = require('gulp'),
    pkg = require('./package.json'),
    merge = require('gulp-merge'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    ember_templates = require('gulp-ember-templates');

var files = {
  vendor_min: [
    './media/js/vendor/jquery-2.1.3.min.js',
    './media/js/vendor/jquery-ui-1.11.1-prod.js',
    './media/js/vendor/handlebars-v2.0.0.min.js',
    './media/js/vendor/ember-1.9.1.min.js',
    './media/js/vendor/loading.js',
    './media/js/vendor/uri.js'
  ],
  vendor_max: [
    './media/js/vendor/ember-browser-detect.js',
    './media/js/vendor/ic-ajax.js',
  ],
  bootstrap: [
    './media/js/vendor/bs-for-ember/bs-core.max.js',
    './media/js/vendor/bs-for-ember/!(bs-core)*.max.js'
  ],
  app: [
    './media/js/jqplugins.js',
    './media/js/app.js',
    './media/js/api.js',
    './media/js/documentview.js',
    './media/js/canvas.js',
    './media/js/models.js',
    './media/js/routes.js',
    './media/js/emberui.js',
    './media/js/views.js',
    './media/js/messages.js',
  ],
  controllers: [
    './media/js/controllers/controllers.js',
    './media/js/controllers/!(controllers)*.js'
  ],
}

var template_stream = function() {
  return gulp.src('./media/js/templates/*.handlebars')
    .pipe(ember_templates())
    .pipe(concat('templates.js'));
};

gulp.task('optimize', function() {
  return merge(
      gulp.src(files.vendor_min),
      gulp.src(files.vendor_max
       .concat(files.bootstrap)
       .concat(files.app)
       .concat(files.controllers)).pipe(uglify()),
      template_stream().pipe(uglify()))
    .pipe(concat('portia.min.js'))
    .pipe(gulp.dest('./media/js'));
});

