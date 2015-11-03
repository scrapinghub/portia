import Ember from 'ember';
import {computedCanAddSpider} from '../services/dispatcher';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    activeModels: Ember.computed.readOnly('uiState.models'),
    canAddSpider: computedCanAddSpider(),

    actions: {
        addSchema(project) {
            this.get('dispatcher').addSchema(project, /* redirect = */true);
        },

        removeSchema(schema) {
            this.get('dispatcher').removeSchema(schema);
        },

        saveSchema(schema) {
            schema.save();
        },

        addSpider(project) {
            this.get('dispatcher').addSpider(project, /* redirect = */true);
        },

        removeSpider(spider) {
            this.get('dispatcher').removeSpider(spider);
        },

        saveSpider(spider) {
            spider.save();
        }
    }
});
