import BaseRoute from './base-route';

export default BaseRoute.extend({
    fixedToolbox: false,

    model: function(params) {
        return this.get('slyd').loadSpider(params.spider_id);
    },

    afterModel: function() {
        // Load the items.
        var controller = this.controllerFor('spider');
        return this.get('slyd').loadItems().then(function(items) {
            controller.set('itemDefinitions', items);
        });
    },

    renderTemplate: function() {
        var controller = this.controllerFor('spider');
        this.render('spider/toolbox', {
            into: 'application',
            outlet: 'main',
            controller: controller,
        });

        this.render('spider/topbar', {
            into: 'application',
            outlet: 'topbar',
            controller: controller,
        });
    },
});
