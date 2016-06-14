import Ember from 'ember';
import {computedCanAddSample} from '../services/dispatcher';
import startUrl from '../models/start-url';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    project: null,
    spider: null,

    canAddSample: computedCanAddSample('spider'),
    currentSample: Ember.computed.readOnly('uiState.models.sample'),

    init() {
        this._super();
        this.set('newUrl', false);
    },

    actions: {
        addStartUrl() {
            this.get('closeOptions')();
            const spider = this.get('spider');
            let newUrl = this.get('browser.url') || '';
            const urls = spider.get('startUrls').mapBy('url');
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

        addGenerationUrl() {
            const spider = this.get('spider');
            let newUrl = this.get('browser.url') || '';
            let newStartUrl = this.get('dispatcher').addGeneratedUrl(spider, newUrl);
            this.get('transitionToFragments')(spider.get('startUrls').indexOf(newStartUrl));
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
