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

    setupController(controller) {
        this._super(...arguments);
        Ember.run.next(function () {
            controller.activate();
        });
    },

    resetController(controller, isExiting) {
        Ember.run.next(function () {
            controller.deactivate();
            if (!isExiting) {
                controller.activate();
            }
        });
    },

    renderTemplate() {
        this.render('projects/project/spider/structure', {
            into: 'projects/project/structure',
            outlet: 'project-structure'
        });

        this.render('projects/project/spider/overlays', {
            into: 'projects/project',
            outlet: 'browser-overlays'
        });

        this.render('projects/project/spider/tools', {
            into: 'tool-panels',
            outlet: 'tool-panels'
        });

        this.render('projects/project/spider/tools-show-links', {
            into: 'projects/project/spider/tools',
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
