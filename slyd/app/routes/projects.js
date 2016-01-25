import BaseRoute from './base-route';

export default BaseRoute.extend({
    model: function() {
        return this.get('slyd').getProjectNames();
    },

    afterModel: function() {
        this.modelFor('projects').forEach(function(project) {
            if (project instanceof Object) {
                this.set('project_models.projects.'+project.id, project.name);
            } else {
                this.set('project_models.projects.'+project, project);
            }
        }.bind(this));
    },

    renderTemplate: function() {
        var controller = this.controllerFor('projects');
        this.render('projects/toolbox', {
            into: 'application',
            outlet: 'main',
            controller: controller,
        });

        this.render('projects/topbar', {
            into: 'application',
            outlet: 'topbar',
            controller: controller,
        });
    }
});