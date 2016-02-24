import Ember from 'ember';

export default Ember.Route.extend({
    browser: Ember.inject.service(),

    model(params) {
        return this.store.findRecord('sample', params.sample_id);
    },

    afterModel(model) {
        this.set('browser.url', model.get('url'));
    },

    renderTemplate() {
        this.render('projects/project/spider/sample/structure', {
            into: 'projects/project/spider/structure',
            outlet: 'spider-structure'
        });

        this.render('projects/project/spider/sample/toolbar', {
            into: 'projects/project',
            outlet: 'browser-toolbar'
        });
    },

    actions: {
        error() {
            this.transitionTo('projects.project.spider',
                this.modelFor('projects.project.spider'));
        },

        deactivate() {
            let sample = this.get('currentModel');
            if(sample) {
                sample.set('_autoCreatedSchema', null);
            }
        },
    }
});
