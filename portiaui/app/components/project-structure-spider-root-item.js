import Ember from 'ember';
import {computedCanAddSpider} from '../services/dispatcher';


export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    canAddSpider: computedCanAddSpider(),
    cannotAddSpider: Ember.computed.not('canAddSpider'),

    actions: {
        addSpider() {
            const project = this.get('uiState.models.project');
            this.get('dispatcher').addSpider(project, /* redirect = */true);
        }
    }
});
