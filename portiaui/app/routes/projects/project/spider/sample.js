import Ember from 'ember';

export default Ember.Route.extend({
    browser: Ember.inject.service(),
    extractedItems: Ember.inject.service(),

    model(params) {
        return this.store.queryRecord('sample', {
            id: params.sample_id,
            spider_id: this.modelFor('projects.project.spider').get('id'),
            spider_project_id: this.modelFor('projects.project').get('id')
        });
    },

    afterModel(model) {
        this.get('extractedItems').update();
        // reload the model to fetch it with annotations included
        // TODO: allow fetching as a relationship, need to inline annotations first
        return model.reload();
    },

    renderTemplate() {
        this.render('projects/project/spider/sample/structure', {
            into: 'projects/project/spider/structure',
            outlet: 'spider-structure'
        });

        this.render('projects/project/spider/sample/toolbar', {
            into: 'projects/project',
            outlet: 'browser-toolbar'
        });
    },

    actions: {
        error() {
            this.transitionTo('projects.project.spider',
                this.modelFor('projects.project.spider'));
        },

        deactivate() {
            let sample = this.get('currentModel');
            if(sample) {
                sample.set('_autoCreatedSchema', null);
            }
        },
    }
});
