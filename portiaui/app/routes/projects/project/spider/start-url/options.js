import Ember from 'ember';
import OptionsRoute from '../../../../../mixins/options-route';

export default Ember.Route.extend(OptionsRoute, {
    model() {
        return this.modelFor('projects.project.spider.start-url');
    },

    afterModel(model) {
        if (!model) {
            this.transitionTo('projects.project.spider', spider);
        }
    },

    renderTemplate() {
        this.render('projects/project/spider/start-url/options', {
            into: 'options-panels',
            outlet: 'options-panels'
        });
    },

    actions: {
        closeOptions() {
            let spider = this.modelFor('projects.project.spider');
            this.transitionTo('projects.project.spider', spider);
        }
    }
});
