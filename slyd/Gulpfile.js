var gulp = require('gulp'),
    pkg = require('./package.json'),
    merge = require('gulp-merge'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify'),
    minifyCSS = require('gulp-minify-css'),
    ember_templates = require('gulp-ember-templates');

var src = {
  js: {
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
  },
  css: {
    vendor_min: [
      './media/css/bootstrap.min.css',
      './media/css/bootstrap-theme.min.css',
    ],
    vendor_max: [
      './media/css/normalize.css',
      './media/css/jquery-ui-1.10.3.custom.css',
      './media/css/font-awesome.css',
    ],
    app: [
      './media/css/style.css',
    ],
  },
  templates: [
    './media/js/templates/*.handlebars',
  ]
}

var template_stream = function() {
  return gulp.src(src.templates)
    .pipe(ember_templates())
    .pipe(concat('templates.js'));
};

gulp.task('minify_js', function() {
  return merge(
      gulp.src(src.js.vendor_min),
      gulp.src(src.js.vendor_max
       .concat(src.js.bootstrap)
       .concat(src.js.app)
       .concat(src.js.controllers)).pipe(uglify()),
      template_stream().pipe(uglify()))
    .pipe(concat('portia.min.js'))
    .pipe(gulp.dest('./media/js'));
});

gulp.task('minify_css', function() {
  return merge(
      gulp.src(src.css.vendor_max).pipe(minifyCSS()),
      gulp.src(src.css.vendor_min),
      gulp.src(src.css.app).pipe(minifyCSS()))
    .pipe(concat('style.min.css'))
    .pipe(gulp.dest('./media/css'))
})

gulp.task('watch', function () {
  gulp.watch(src.css.app, ['minify_css']);
  var js = src.js.app.concat(src.js.controllers).concat(src.templates);
  gulp.watch(js, ['minify_js']);
});


gulp.task('optimize', ['minify_js', 'minify_css']);
gulp.task('default', ['minify_js', 'minify_css', 'watch'])