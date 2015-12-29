import Ember from 'ember';
import {
    computedCanAddSample,
    computedEditableSample
} from '../services/dispatcher';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    tagName: '',

    spider: null,

    canAddSample: computedCanAddSample('spider'),
    editableSample: computedEditableSample('spider'),

    actions: {
        addSample() {
            this.get('dispatcher').addSample(this.get('spider'), /* redirect = */true);
        }
    }
});
