import Ember from 'ember';
const { computed } = Ember;
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

    tagName:      '',
    spiderSearch: '',
    isFiltering:  false,

    didReceiveAttrs() {
        const spiders = this.get('sortedSpiders').slice(0, LIMIT);
        const currentSpider = this.get('currentSpider');

        if (currentSpider && !spiders.includes(currentSpider)) {
            spiders.pushObject(currentSpider);
        }
        this.set('spiders', spiders);
        this.set('filteredSpiders', this.get('sortedSpiders'));
    },

    currentPage: 0,
    hasPreviousPage: computed.gte('currentPage', 1),
    hasNextPage: computed('currentPage', 'filteredSpiders.length', function() {
        const max = (this.get('currentPage') + 1) * LIMIT;
        return max < this.get('filteredSpiders.length');
    }),

    numSpiders: computed.readOnly('project.spiders.length'),
    canAddSpider: computedCanAddSpider(),
    currentSpider: computed.readOnly('uiState.models.spider'),
    noCurrentSpider: computed.not('currentSpider'),
    currentSchema: computed.readOnly('uiState.models.schema'),
    isLarge: computed.gt('project.spiders.length', LIMIT),

    sortedSpiders: computed.sort('project.spiders', function(spider, other_spider) {
        const [a, b] = [spider, other_spider].map((spider) => {
            return spider.get('id').toLowerCase();
        });

        if (a < b) {
            return -1;
        } else if (a > b) {
            return 1;
        }
        return 0;
    }),

    filterSpiders: task(function * (spiders, term) {
        this.set('isFiltering', true);

        yield timeout(FILTER_DEBOUNCE);

        if (term === '') { this._updateFilter(this.get('sortedSpiders')); }
        this._updateFilter(this._fuzzyFilter(spiders, term), term);
    }).restartable(),

    addSpiderTooltipText: computed('canAddSpider', {
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
        },

        nextPage() {
            this._turnPage();
        },
        previousPage() {
            this._turnPage(false);
        }
    },

    _turnPage(isNext = true) {
        if (this.get('isFiltering')) { return; }

        const nextPage = isNext ? this.get('currentPage') + 1
                                : this.get('currentPage') - 1;

        let start = nextPage * LIMIT;
        this.set('spiders', this.get('filteredSpiders')
                                .slice(start, start + LIMIT));
        this.set('currentPage', nextPage);
    },

    _fuzzyFilter(items, term) {
        const fuzzy = new RegExp(term.split('').join('.*'), 'i');
        return items.filter((item) => {
            return fuzzy.exec(item.get('id'));
        });
    },

    _updateFilter(spiders, term = '') {
        this.set('spiderSearch', term);
        this.set('currentPage',  0);
        this.set('isFiltering',  false);

        this.set('spiders',         spiders.slice(0, LIMIT));
        this.set('filteredSpiders', spiders);
    }
});
