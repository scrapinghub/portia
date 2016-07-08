import Ember from 'ember';
import {computedCanAddSample} from '../services/dispatcher';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    project: null,
    spider: null,
    newStartUrl: null,

    canAddSample: computedCanAddSample('spider'),
    currentSample: Ember.computed.readOnly('uiState.models.sample'),

    init() {
        this._super();
        this.set('newUrl', false);
    },

    getNewStartUrl(newUrl) {
        let newStartUrl = '';
        if (newUrl) {
            const spider = this.get('spider');
            newStartUrl = this.get('dispatcher').addStartUrl(spider, newUrl);
        }
        return newStartUrl;
    },

    getNewUrl() {
        let newUrl = this.get('browser.url') || '';
        const urls = this.get('spider.startUrls').mapBy('url');
        if (newUrl && urls.includes(newUrl)) {
            newUrl = '';
        }
        return newUrl;
    },

    actions: {
        addStartUrl() {
            this.get('closeOptions')();

            const newUrl = this.getNewUrl();

            this.setProperties({
                newUrl: true,
                urlValue: newUrl,
                newStartUrl: this.getNewStartUrl(newUrl)
            });
        },

        addGenerationUrl() {
            const spider = this.get('spider');
            let newUrl = this.get('browser.url') || '';
            let newStartUrl = this.get('dispatcher').addGeneratedUrl(spider, newUrl);
            this.get('transitionToFragments')(spider.get('startUrls').indexOf(newStartUrl));
        },

        removeStartUrl(startUrl) {
            this.get('dispatcher').removeStartUrl(this.get('spider'), startUrl);
            this.get('closeOptions')();
        },

        addSample() {
            this.get('dispatcher').addSample(this.get('spider'), /* redirect = */true);
        },

        removeSample(sample) {
            this.get('dispatcher').removeSample(sample);
        },

        saveSample(sample) {
            sample.save();
        }
    }
});
