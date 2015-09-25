import Ember from 'ember';

export default Ember.Route.extend({
    browser: Ember.inject.service(),

    model(params) {
        return this.store.findRecord('spider', params.spider_id);
    },

    afterModel(model) {
        this.store.findAll('sample');
        this.set('browser.url', model.get('startUrls.firstObject'));
    },

    renderTemplate() {
        this.render('projects/project/spider-tools', {
            into: 'side-bar',
            outlet: 'tool-panels'
        });
    },

    actions: {
        error: function() {
            this.transitionTo('projects.project',
                this.modelFor('projects.project'));
        }
    }
});
