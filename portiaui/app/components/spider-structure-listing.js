import Ember from 'ember';
import {computedCanAddSample} from '../services/dispatcher';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    tagName: '',

    project: null,
    spider: null,

    canAddSample: computedCanAddSample('spider'),

    init() {
        this._super();
        this.set('newUrl', false);
    },

    actions: {
        addStartUrl() {
            const spider = this.get('spider');
            let newUrl = this.get('browser.url') || '';
            const urls = spider.get('startUrls');
            if (newUrl && urls.includes(newUrl)) {
                newUrl = '';
            }
            if (newUrl) {
                this.get('dispatcher').addStartUrl(spider, newUrl);
            }
            this.setProperties({
                newUrl: true,
                urlValue: newUrl
            });
        },

        addSample() {
            this.get('dispatcher').addSample(this.get('spider'), /* redirect = */true);
        },

        removeSample(sample) {
            this.get('dispatcher').removeSample(sample);
        },

        saveSample(sample) {
            sample.save();
        },

        openLinkOptions() {
            this.sendAction('openLinkOptions');
        },

        closeLinkOptions() {
            this.sendAction('closeLinkOptions');
        }
    }
});
