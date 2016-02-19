import Ember from 'ember';
import OptionsRoute from '../../../../mixins/options-route';

export default Ember.Route.extend(OptionsRoute, {
    model() {
        return this.modelFor('projects.project.spider');
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
        this.render('projects/project/spider/link-options', {
            into: 'options-panels',
            outlet: 'options-panels'
        });

        this.render('projects/project/spider/overlays', {
            into: 'projects/project',
            outlet: 'browser-overlays'
        });
    },

    actions: {
        close() {
            this.transitionTo('projects.project.spider');
        }
    }
});
