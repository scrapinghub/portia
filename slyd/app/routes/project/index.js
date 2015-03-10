import BaseRoute from '../base-route';

export default BaseRoute.extend({
    fixedToolbox: false,

    model: function() {
        return this.get('slyd').getSpiderNames();
    },

    afterModel: function() {
        if (this.get('capabilities.version_control')) {
            var controller = this.controllerFor('project.index');
            return this.get('slyd').conflictedFiles(this.get('slyd.project')).then(
                function(conflictedFiles) {
                    if (Object.keys(conflictedFiles).length !== 0) {
                        // If there are conflicted files, redirect the user to
                        // automated concept resolution.
                        this.transitionTo('conflicts');
                    }
                }.bind(this)
            ).then(function() {
                return this.get('slyd').changedFiles(this.get('slyd.project'));
            }.bind(this)).then(function(changes) {
                controller.set('changedFiles', changes);
            });
        }
    },

    renderTemplate: function() {
        var controller = this.controllerFor('project.index');
        this.render('project/toolbox', {
            into: 'application',
            outlet: 'main',
            controller: controller,
        });

        this.render('project/topbar', {
            into: 'application',
            outlet: 'topbar',
            controller: controller,
        });
    },

    serialize: function() {
        var controller = this.controllerFor('project.index');
        return { project_id: controller.get('name') };
    },
});
