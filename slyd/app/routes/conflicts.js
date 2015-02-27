import BaseRoute from '../base-route';

export default BaseRoute.extend({
    model: function() {
        return this.get('slyd').conflictedFiles(this.get('slyd.project'));
    },

    renderTemplate: function() {
        var controller = this.controllerFor('conflicts');
        this.render('conflicts/toolbox', {
            into: 'application',
            outlet: 'main',
            controller: controller,
        });

        this.render('conflicts/topbar', {
            into: 'application',
            outlet: 'topbar',
            controller: controller,
        });

        this.render('conflicts/resolver', {
            into: 'application',
            outlet: 'conflictResolver',
            controller: controller,
        });
    },
});
