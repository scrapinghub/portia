import Ember from 'ember';
import { NAMED_COLORS } from '../utils/colors';

export default Ember.Component.extend({
    tagName: '',

    spider: null,

    colors: NAMED_COLORS,
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
            label: 'Configure follow and exclude patterns'
        }
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
        save() {
            this.get('spider').save();
        }
    }
});
