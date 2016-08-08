import Ember from 'ember';
const { computed } = Ember;
import { getColors } from '../utils/colors';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    startUrl: computed('spider.startUrls.[]', 'startUrlId', function() {
        return this.get('spider').get('startUrls').objectAt(this.get('startUrlId'));
    }),
    generatedUrlLists: computed('fragments.@each.type', 'fragments.@each.value', function() {
        return this.get('startUrl').generateList();
    }),

    fragments: computed.alias('startUrl.fragments'),
    fragmentColors: computed('fragments.[]', function() {
        return getColors(this.get('fragments.length'));
    }),
    rawColors: computed.mapBy('fragmentColors', 'main'),

    actions: {
        addFragment() {
            this.get('dispatcher').addFragment(this.get('startUrl'));
            this.get('saveSpider')();
        },

        removeFragment(fragment) {
            this.get('dispatcher').removeFragment(this.get('startUrl'), fragment);
            this.get('saveSpider')();
        }
    }
});
