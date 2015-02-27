import BaseRoute from './base-route';

export default BaseRoute.extend({
    model: function() {
        return this.get('slyd').getProjectNames();
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
    },
});