import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        return this.store.findRecord('sample', params.sample_id);
    },

    renderTemplate() {
        this.render('projects/project/spider/sample-tools', {
            into: 'projects/project/spider-tools',
            outlet: 'tool-panels'
        });
    }
});
