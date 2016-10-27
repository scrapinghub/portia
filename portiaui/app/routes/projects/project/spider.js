import Ember from 'ember';

export default Ember.Route.extend({
    browser: Ember.inject.service(),

    model(params) {
        return this.store.peekRecord('spider', params.spider_id);
    },

    afterModel(model) {
        return model.reload().then(() => model.get('samples'));
    },

    redirect(model, {queryParams}) {
        /* The route may be loaded from a partial model without all data from
           the backed, and an undefined firstUrl. This is fired after afterModel
           so the model will have been reloaded from the backend. */
        if (queryParams.url === undefined && queryParams.baseurl === undefined) {
            const url = model.get('firstUrl');
            if (url === undefined) {
                return;
            }
            this.transitionTo('projects.project.spider', {
                queryParams: {
                    url,
                    baseurl: null
                }
            });
        }
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

        this.render('projects/project/spider/toolbar', {
            into: 'projects/project',
            outlet: 'browser-toolbar'
        });
    },

    actions: {
        error() {
            this.transitionTo('projects.project',
                this.modelFor('projects.project'));
        },

        transitionToFragments(start_url_id) {
            this.transitionTo('projects.project.spider.start-url.options', start_url_id);
        },

        closeOptions() {
            let spider = this.modelFor('projects.project.spider');
            this.transitionTo('projects.project.spider', spider);
        }
    }
});
