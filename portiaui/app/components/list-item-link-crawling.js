import Ember from 'ember';

export default Ember.Component.extend({
    routing: Ember.inject.service('-routing'),
    tagName: '',

    spider: null,

    followPatternOptions: [
        {
            value: 'all',
            label: 'Follow all in-domain links'
        },
        {
            value: 'none',
            label: "Don't follow links"
        },
        {
            value: 'patterns',
            label: 'Configure url patterns'
        },
        {
            value: 'auto',
            label: 'Follow links automatically'
        },
    ],

    linksToFollow: Ember.computed('spider.linksToFollow', {
        get() {
            return this.followPatternOptions.findBy('value', this.get('spider.linksToFollow'));
        },

        set(key, value) {
            this.set('spider.linksToFollow', value.value);
            return value;
        }
    }),

    actions: {
        saveSpider() {
            this.get('spider').save().then(() => {
                if (this.get('linksToFollow.value') === 'patterns') {
                    this.get('routing').transitionTo('projects.project.spider.link-options');
                } else if (this.get('linksToFollow.value') === 'none' &&
                        this.get('routing.currentRouteName').endsWith('link-options')) {
                    this.get('routing').transitionTo('projects.project.spider');
                }
            });
        }
    }
});
