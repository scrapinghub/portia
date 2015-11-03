import Ember from 'ember';
import {computedCanAddSample} from '../services/dispatcher';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    project: null,
    spider: null,

    activeModels: Ember.computed.readOnly('uiState.models'),
    canAddSample: computedCanAddSample('spider'),

    actions: {
        addSample(spider) {
            this.get('dispatcher').addSample(spider, /* redirect = */true);
        },

        removeSample(sample) {
            this.get('dispatcher').removeSample(sample);
        },

        saveSample(sample) {
            sample.save();
        }
    }
});
