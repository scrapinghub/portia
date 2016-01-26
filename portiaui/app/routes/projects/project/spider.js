import Ember from 'ember';

export default Ember.Route.extend({
    browser: Ember.inject.service(),

    model(params) {
        return this.store.findRecord('spider', params.spider_id);
    },

    afterModel(model) {
        this.set('browser.url', model.get('startUrls.firstObject'));
    },

    deactivate() {
        this.set('browser.url', null);
    },

    renderTemplate() {
        this.render('projects/project/spider/structure', {
            into: 'projects/project/structure',
            outlet: 'project-structure'
        });

        this.render('projects/project/spider/tools', {
            into: 'tool-panels',
            outlet: 'tool-panels'
        });

        this.render('projects/project/spider/toolbar', {
            into: 'projects/project',
            outlet: 'browser-toolbar'
        });
    },

    actions: {
        error() {
            this.transitionTo('projects.project',
                this.modelFor('projects.project'));
        }
    }
});
