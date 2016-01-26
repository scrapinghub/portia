import Ember from 'ember';
import OptionsRoute from '../../../../mixins/options-route';

export default Ember.Route.extend(OptionsRoute, {
    model() {
        return this.modelFor('projects.project.spider');
    },

    renderTemplate() {
        this.render('projects/project/spider/link-options', {
            into: 'options-panels',
            outlet: 'options-panels'
        });

    },

    actions: {
        close() {
            this.transitionTo('projects.project.spider');
        }
    }
});
