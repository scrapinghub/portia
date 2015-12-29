import Ember from 'ember';
import OptionsRoute from '../../../../../mixins/options-route';

export default Ember.Route.extend(OptionsRoute, {
    model() {
        return this.modelFor('projects.project.schema.field');
    },

    renderTemplate() {
        this.render('projects/project/schema/field/options', {
            into: 'options-panels',
            outlet: 'options-panels'
        });
    },

    actions: {
        close() {
            this.transitionTo('projects.project.schema.field');
        }
    }
});
