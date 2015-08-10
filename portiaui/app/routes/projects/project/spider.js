import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        return this.store.findRecord('spider', params.spider_id);
    },

    renderTemplate() {
        this.render('projects/project/spider-tools', {
            into: 'side-bar',
            outlet: 'tool-panels'
        });
    }
});
