import Ember from 'ember';
import {computedCanAddSpider} from '../services/dispatcher';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),
    notificationManager: Ember.inject.service(),
    routing: Ember.inject.service('-routing'),

    tagName: '',

    canAddSpider: computedCanAddSpider(),
    currentSpider: Ember.computed.readOnly('uiState.models.spider'),
    currentSchema: Ember.computed.readOnly('uiState.models.schema'),

    addSpiderTooltipText: Ember.computed('canAddSpider', {
        get() {
            if (this.get('canAddSpider')) {
                return 'Create a new Spider';
            } else {
                return 'You must visit a website before you can create a Spider';
            }
        }
    }),

    actions: {
        addSchema() {
            this.get('dispatcher').addSchema(this.get('project'), /* redirect = */true);
        },

        removeSchema(schema) {
            this.get('dispatcher').removeSchema(schema);
        },

        saveSchema(schema) {
            schema.save();
        },

        addSpider() {
            this.get('dispatcher').addSpider(this.get('project'), /* redirect = */true);
        },

        removeSpider(spider) {
            this.get('dispatcher').removeSpider(spider);
        },

        validateSpiderName(name) {
            const nm = this.get('notificationManager');
            if(!name) {
                nm.showWarningNotification(`Invalid spider name.
                    An empty name is not allowed.`);
                return false;
            }
            if(/\\|\//.test(name)) {
                nm.showWarningNotification(`Invalid spider name.
                    Slashes are not allowed.`);
                return false;
            }
            if(/^\.+$/.test(name)) {
                nm.showWarningNotification(`Invalid spider name.
                    You cannot use only dots as a spider name.`);
                return false;
            }
            return true;
        },

        saveSpiderName(spider) {
            // HACK: Renaming the spider will change it's ID, changing the ID
            // of a record is not supported in Ember data, so we return a new
            // record from the server and mark the original as deleted.
            spider.save().then(() => {
                if(spider.get('name') === '_deleted') {
                    spider.unloadRecord();
                }
            });
        }
    }
});
