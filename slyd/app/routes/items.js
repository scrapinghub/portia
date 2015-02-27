import BaseRoute from './base-route';

export default BaseRoute.extend({
    model: function() {
        return this.get('slyd').loadItems();
    },

    renderTemplate: function() {
        var controller = this.controllerFor('items');
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
