import Ember from 'ember';
const { computed } = Ember;
import {computedCanAddSpider} from '../services/dispatcher';

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    jobQ: Ember.inject.service(),
    uiState: Ember.inject.service(),
    notificationManager: Ember.inject.service(),
    routing: Ember.inject.service('-routing'),

    tagName: '',

    canAddSpider: computedCanAddSpider(),
    currentSpider: Ember.computed.readOnly('uiState.models.spider'),
    currentSchema: Ember.computed.readOnly('uiState.models.schema'),

    jobCount: computed.alias('jobQ.jobs.count'),
    spiderJobs: computed('jobCount', 'currentSpider', function() {
        return this.get('jobQ.jobs').countForSpider();
    }),
    showJobs: computed('spiderJobs', 'routing.currentRouteName', function() {
        return this.get('spiderJobs') > 0 && this.get('routing.currentRouteName').includes('spider');
    }),
    jobMessage: computed('spiderJobs', function() {
        let isPlural = this.get('spiderJobs') > 1;
        return `${this.get('spiderJobs')} job${isPlural ? 's' : ''} running`;
    }),

    addSpiderTooltipText: computed('canAddSpider', {
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
            if(!/^[a-zA-Z0-9][a-zA-Z0-9_\.-]*$/.test(name)) {
                nm.showWarningNotification(`Invalid spider name.
                    Only letters, numbers, underscores, dashes and dots are allowed.`);
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
