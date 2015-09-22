import Ember from 'ember';
import {computedCanAddSpider} from '../services/dispatcher';


export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    canAddSpider: computedCanAddSpider(),
    cannotAddSpider: Ember.computed.not('canAddSpider'),

    actions: {
        addSpider() {
            this.get('dispatcher').addSpider();
        }
    }
});
