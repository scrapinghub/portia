import Ember from 'ember';
import {computedCanAddSample} from '../services/dispatcher';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    tagName: '',

    project: null,
    spider: null,

    canAddSample: computedCanAddSample('spider'),

    actions: {
        saveStartUrl(oldUrl, newUrl) {
            const spider = this.get('spider');
            if (oldUrl !== newUrl) {
                if (!newUrl) {
                    this.get('dispatcher').removeStartUrl(spider, oldUrl);
                } else if (!oldUrl) {
                    this.get('dispatcher').addStartUrl(spider, newUrl);
                } else {
                    this.get('dispatcher').replaceStartUrl(spider, oldUrl, newUrl);
                }
            }
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
