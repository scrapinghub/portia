import Ember from 'ember';
import SaveSpiderMixin from '../mixins/save-spider-mixin';
const { computed, inject: { service } } = Ember;

export default Ember.Component.extend(SaveSpiderMixin, {
    routing: service('-routing'),
    tagName: '',

    spider: null,

    followPatternOptions: [
        {
            value: 'auto',
            label: 'Follow links automatically',
            description: `Use start urls and sample urls to teach the spider the \
                          best links to follow`
        },
        {
            value: 'all',
            label: 'Follow all in-domain links',
            description: `Follow all links which have a domain or sub domain that match \
                          the start or sample urls`
        },
        {
            value: 'none',
            label: "Don't follow links",
            description: `Only attempt to extract data from start urls. Can be combined \
                          to great effect with feed and generated urls`
        },
        {
            value: 'patterns',
            label: 'Configure url patterns',
            description: `Create patterns for the spider to follow or not and direct your \
                          spider with pin point accuracy`
        },
    ],

    linksToFollow: computed('spider.linksToFollow', {
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
            this.saveSpider().then(() => {
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
