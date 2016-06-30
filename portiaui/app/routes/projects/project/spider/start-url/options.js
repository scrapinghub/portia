import Ember from 'ember';
import OptionsRoute from '../../../../../mixins/options-route';

export default Ember.Route.extend(OptionsRoute, {
    model() {
        const startUrl = this.modelFor('projects.project.spider.start-url');

        return {
            spider: this.getSpider(),
            startUrlId: this.getSpider().get('startUrls').indexOf(startUrl)
        };
    },

    afterModel(model) {
        if (!model) {
            this.transitionToSpider();
        }
    },

    renderTemplate() {
        this.render('projects/project/spider/start-url/options', {
            into: 'options-panels',
            outlet: 'options-panels'
        });
    },

    getSpider() {
        return this.modelFor('projects.project.spider');
    },

    transitionToSpider() {
        this.transitionTo('projects.project.spider', this.getSpider());
    },

    actions: {
        closeOptions() {
            this.transitionToSpider();
        },

        saveSpider() {
            this.getSpider().save();
        }
    }
});
