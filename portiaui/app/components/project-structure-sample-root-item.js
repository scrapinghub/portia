import Ember from 'ember';
import {computedCanAddSample} from '../services/dispatcher';


export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    canAddSample: computedCanAddSample('item.spider'),
    cannotAddSample: Ember.computed.not('canAddSample'),

    actions: {
        addSample() {
            const spider = this.get('item.spider.content');
            this.get('dispatcher').addSample(spider);
        }
    }
});
