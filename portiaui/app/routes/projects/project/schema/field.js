import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        return this.store.queryRecord('field', {
            id: params.field_id,
            schema_id: this.modelFor('projects.project.schema').get('id'),
            schema_project_id: this.modelFor('projects.project').get('id')
        });
    }
});
