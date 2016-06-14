import Ember from 'ember';
const { computed } = Ember;
import { cleanUrl } from '../utils/utils';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    tagName: '',

    spider: null,

    fragments: computed.alias('startUrl.fragments'),
    url: computed('startUrl.url', 'fragments.@each.type', 'fragments.@each.value', function() {
        return this.get('startUrl').toString();
    }),

    viewUrl: Ember.computed('url', {
        get() {
            return this.get('url');
        },

        set(key, value, oldValue) {
            this.send('saveStartUrl', oldValue, value);
            return value;
        }
    }),

    actions: {
        removeStartUrl() {
            const spider = this.get('spider');
            const startUrl = this.get('startUrl');
            this.get('dispatcher').removeStartUrl(spider, startUrl);
        },

        saveStartUrl(oldUrl, newUrl) {
            const spider = this.get('spider');
            const startUrl = this.get('startUrl');
            if (oldUrl !== newUrl) {
                if (!newUrl) {
                    this.get('dispatcher').removeStartUrl(spider, startUrl);
                } else {
                    newUrl = cleanUrl(newUrl);
                    if (!oldUrl) {
                        this.get('dispatcher').addStartUrl(spider, newUrl);
                    } else {
                        this.get('dispatcher').replaceStartUrl(spider, oldUrl, newUrl, startUrl);
                    }
                }
            }
        }
    }
});
