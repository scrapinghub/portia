module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: ';'
            },
            dist: {
                src: [
                    // Vendor stuff.
                    'media/js/vendor/jquery-1.11-prod.js',
                    'media/js/vendor/jquery-ui-1.11.1-prod.js',
                    'media/js/vendor/handlebars-1.0.0.js',
                    'media/js/vendor/ember-1.7-prod.js',
                    'media/js/vendor/ember-browser-detect.js',
                    'media/js/vendor/loading.js',
                    'media/js/vendor/ic-ajax.js',
                    'media/js/vendor/uri.js',

                    // Bootstrap integration
                    'media/js/vendor/bs-for-ember/bs-core.max.js',
                    'media/js/vendor/bs-for-ember/bs-badge.max.js',
                    'media/js/vendor/bs-for-ember/bs-breadcrumbs.max.js',
                    'media/js/vendor/bs-for-ember/bs-button.max.js',
                    'media/js/vendor/bs-for-ember/bs-label.max.js',
                    'media/js/vendor/bs-for-ember/bs-modal.max.js',

                    // Portia specific.
                    'media/js/jqplugins.js',
                    'media/js/app.js',
                    'media/js/api.js',
                    'media/js/documentview.js',
                    'media/js/canvas.js',
                    'media/js/models.js',
                    'media/js/routes.js',
                    'media/js/emberui.js',
                    'media/js/views.js',
                    'media/js/messages.js',
                    'media/js/controllers/controllers.js',
                    'media/js/controllers/navigation-controller.js',
                    'media/js/controllers/annotation-controller.js',
                    'media/js/controllers/template-controller.js',
                    'media/js/controllers/application-controller.js',
                    'media/js/controllers/items-controller.js',
                    'media/js/controllers/project-controller.js',
                    'media/js/controllers/projects-controller.js',
                    'media/js/controllers/spider-controller.js',
                    'media/js/controllers/conflicts-controller.js',
                    'media/js/templates.js'
                ],
                dest: 'dist/<%= pkg.name %>.js'
            }
        },
        uglify: {
            dist: {
                files: {
                    'media/js/<%= pkg.name %>.min.js': ['<%= concat.dist.dest %>']
                }
            }
        },
        emberTemplates: {
            compile: {
                options: {
                    templateBasePath: 'media/js/templates'
                },
                files: {
                    'media/js/templates.js": "media/js/templates/*.handlebars'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-ember-templates');

    grunt.registerTask('optimize', ['emberTemplates', 'concat', 'uglify']);
};
