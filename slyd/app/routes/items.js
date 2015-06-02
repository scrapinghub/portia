import BaseRoute from './base-route';

export default BaseRoute.extend({
    defaultControllerName: 'items',

    model: function() {
        return this.get('slyd').loadItems();
    },

    renderTemplate: function() {
        var controller = this.controllerFor(this.get('defaultControllerName'));
        this.render('items/toolbox', {
            into: 'application',
            outlet: 'main',
            controller: controller,
        });

        this.render('template/topbar', {
            into: 'application',
            outlet: 'topbar',
            controller: controller,
        });
    },
});
