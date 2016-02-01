import Ember from 'ember';

export default Ember.Route.extend({
    model() {
        return this.modelFor('projects.project.spider.sample');
    },

    activate() {
        this.controllerFor('projects.project').setClickHandler(this.viewPortClick.bind(this));
    },

    deactivate() {
        this.controllerFor('projects.project').clearClickHandler();
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
        this.render('projects/project/spider/sample/data/structure', {
            into: 'projects/project/spider/sample/structure',
            outlet: 'sample-structure'
        });

        this.render('projects/project/spider/sample/data/overlays', {
            into: 'projects/project',
            outlet: 'browser-overlays'
        });

        this.render('projects/project/spider/sample/data/toolbar', {
            into: 'projects/project/spider/sample/toolbar',
            outlet: 'browser-toolbar'
        });
    },

    viewPortClick() {
        this.get('controller').send('selectElement', ...arguments);
    }
});
