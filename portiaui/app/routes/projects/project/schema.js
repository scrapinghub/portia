import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        return this.store.queryRecord('schema', {
            id: params.schema_id,
            project_id: this.modelFor('projects.project').get('id')
        });
    },

    afterModel(model) {
        return this.store.query('field', {
            schema_project_id: this.modelFor('projects.project').get('id'),
            schema_id: model.get('id')
        });
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
