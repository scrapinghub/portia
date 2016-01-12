import Ember from 'ember';
import { computedCanAddStartUrl } from '../services/dispatcher';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    tagName: '',

    spider: null,

    canAddStartUrl: computedCanAddStartUrl('spider'),

    actions: {
        toggleStartUrl() {
            const url = this.get('browser.url');
            if (!url) {
                return;
            }
            if (this.get('canAddStartUrl')) {
                this.get('dispatcher').addStartUrl(this.get('spider'), url);
            } else {
                this.get('dispatcher').removeStartUrl(this.get('spider'), url);
            }
        }
    }
});
