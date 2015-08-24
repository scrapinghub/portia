import Ember from 'ember';
import BaseRoute from './base-route';

export default BaseRoute.extend({

    model: function(params) {
        var spider = this.modelFor('spider');
        return this.get('slyd').loadTemplate(spider.get('name'), params.template_id);
    },

    afterModel: function() {
        var controller = this.controllerFor('template');
        var slyd = this.get('slyd');

        // Load the items.
        var itemsPromise = slyd.loadItems().then(function(items) {
            controller.set('project_models.items', items);
        });
        // Load the extractors.
        var extractorsPromise = slyd.loadExtractors().then(function(extractors) {
            controller.set('project_models.extractors', extractors);
        });
        return Ember.RSVP.all([itemsPromise, extractorsPromise]);
    },

    renderTemplate: function() {
        var controller = this.controllerFor('template');
        this.render('template/toolbox', {
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
