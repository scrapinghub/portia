import Ember from 'ember';
const { computed } = Ember;
import { cleanUrl } from '../utils/utils';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),
    tagName: '',

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

    handleNewUrl(oldUrl, newUrl) {
        const spider = this.get('spider');
        const cleanNewUrl= cleanUrl(newUrl);

        if (!oldUrl) {
            this.get('dispatcher').addStartUrl(spider, cleanNewUrl);
        } else {
            this.get('dispatcher').replaceStartUrl(spider, oldUrl, cleanNewUrl);
        }
    },

    removeStartUrl() {
        this.get('dispatcher').removeStartUrl(this.get('spider'),
                                              this.get('startUrl'));
    },

    actions: {
        saveStartUrl(oldUrl, newUrl) {
            if (oldUrl !== newUrl) {
                if (newUrl) {
                    this.handleNewUrl(oldUrl, newUrl);
                } else {
                    this.removeStartUrl();
                }
            }
        }
    }
});
