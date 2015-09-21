import Ember from 'ember';
import {computedCanAddStartUrl} from '../services/dispatcher';


export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),

    canAddUrl: computedCanAddStartUrl('item.spider'),
    cannotAddUrl: Ember.computed.not('canAddUrl'),

    actions: {
        addStartUrl() {
            const spider = this.get('item.spider.content');
            this.get('dispatcher').addStartUrl(spider);
        }
    }
});
