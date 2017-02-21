import Ember from 'ember';
import OptionsRoute from '../../../../../../../mixins/options-route';

export default Ember.Route.extend(OptionsRoute, {
    model() {
        return this.modelFor('projects.project.spider.sample.data.annotation');
    },

    afterModel() {
        let extractorsPromise = this.modelFor('projects.project').get('extractors');
        if (!extractorsPromise.get('isPending')) {
            extractorsPromise = extractorsPromise.reload();
        }
        return extractorsPromise;
    },

    renderTemplate() {
        this.render('projects/project/spider/sample/data/annotation/options', {
            into: 'options-panels',
            outlet: 'options-panels'
        });
    },

    actions: {
        close() {
            this.transitionTo('projects.project.spider.sample.data.annotation');
        }
    }
});
