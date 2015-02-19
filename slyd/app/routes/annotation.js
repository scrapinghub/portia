import Ember from 'ember';
import BaseRoute from './base-route';

export default BaseRoute.extend({
    model: function() {
        return null;
    },

    afterModel: function(model) {
        if (Ember.isEmpty(model)) {
            this.transitionTo('template');
        }
    },

    renderTemplate: function() {
        var controller = this.controllerFor('annotation');
        this.render('annotation/toolbox', {
            controller: controller,
        });

        this.render('template/topbar', {
            into: 'application',
            outlet: 'topbar',
            controller: controller,
        });
    },
});
