import Ember from 'ember';
import {computedCanAddSpider} from '../services/dispatcher';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    tagName: '',

    project: null,

    canAddSpider: computedCanAddSpider(),

    actions: {
        addSpider() {
            this.get('dispatcher').addSpider(this.get('project'), /* redirect = */true);
        }
    }
});
