import Ember from 'ember';
import {computedCanAddSpider} from '../services/dispatcher';
import { task, timeout } from 'ember-concurrency';

const LIMIT = 15;
const FILTER_DEBOUNCE = 800;

export default Ember.Component.extend({
    browser: Ember.inject.service(),
    dispatcher: Ember.inject.service(),
    notificationManager: Ember.inject.service(),
    routing: Ember.inject.service('-routing'),
    savingNotification: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',
    isFiltering: false,

    didReceiveAttrs() {
        this._super(...arguments);

        const spiders = this.get('project.spiders').slice(0, LIMIT);
        const currentSpider = this.get('currentSpider');

        if (currentSpider && !spiders.includes(currentSpider)) {
            spiders.pushObject(currentSpider);
        }
        this.set('spiders', spiders);
    },

    canAddSpider: computedCanAddSpider(),
    currentSpider: Ember.computed.readOnly('uiState.models.spider'),
    currentSchema: Ember.computed.readOnly('uiState.models.schema'),
    spiderSorting: ['id'],
    sortedSpiders: Ember.computed.sort('spiders', 'spiderSorting'),
    isLarge: Ember.computed.gt('project.spiders.length', LIMIT),

    filterSpiders: task(function * (spiders, term) {
        if (term === '') {
            this.set('isFiltering', false);
            this.set('spiders', this.get('project.spiders').slice(0, LIMIT));
        }

        this.set('isFiltering', true);
        yield timeout(FILTER_DEBOUNCE);
        this.set('isFiltering', false);

        this.set('spiders', this._fuzzyFilter(spiders, term));
    }).restartable(),

    addSpiderTooltipText: Ember.computed('canAddSpider', {
        get() {
            if (this.get('canAddSpider')) {
                return 'Create a new Spider';
            } else {
                return 'You must visit a website before you can create a Spider';
            }
        }
    }),

    notifyError(spider) {
        const msg = `Renaming the spider '${spider.get('id')}' failed.`;
        this.get('notificationManager').showErrorNotification(msg);

        spider.set('name', spider.get('id'));
    },

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

        validateSpiderName(spider, name) {
            const nm = this.get('notificationManager');
            if(!/^[a-zA-Z0-9][a-zA-Z0-9_\.-]*$/.test(name)) {
                nm.showWarningNotification(`Invalid spider name.
                    Only letters, numbers, underscores, dashes and dots are allowed.`);
                return false;
            }
            if (spider.get('id') === name) {
                return true;
            }
            const spiders = this.get('project.spiders').mapBy('id');
            if(spiders.indexOf(name) >= 0) {
                nm.showWarningNotification(`Invalid spider name.
                    A spider already exists with the name "${name}"`);
                return false;
            }
            return true;
        },

        saveSpiderName(spider) {
            const dispatcher = this.get('dispatcher');
            const saving = this.get('savingNotification');

            saving.start();

            dispatcher.changeSpiderName(spider)
                .then((data) => dispatcher.changeId(spider, data))
                .catch(() => this.notifyError(spider))
                .finally(() => saving.end());
        }
    },

    _fuzzyFilter(items, term) {
        const fuzzy = new RegExp(term.split('').join('.*'));
        return items.filter((item) => {
            return fuzzy.exec(item.get('id'));
        }).slice(0, LIMIT);
    }
});
