import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        return this.store.findRecord('schema', params.schema_id);
    },

    renderTemplate() {
        this.render('projects/project/schema/structure', {
            into: 'projects/project/structure',
            outlet: 'project-structure'
        });
    },

    actions: {
        error: function() {
            this.transitionTo('projects.project',
                this.modelFor('projects.project'));
        }
    }
});
