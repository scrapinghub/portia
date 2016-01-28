import Ember from 'ember';

export default Ember.Route.extend({
    model() {
        return this.store.findAll('project');
    },

    afterModel(projects) {
        if (!projects.get('length')) {
            const project = this.store.createRecord('project', {
                name: 'Test Project'
            });
            project.save();
        }
    }
});
