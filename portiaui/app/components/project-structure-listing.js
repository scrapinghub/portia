import Ember from 'ember';
const { computed, observer } = Ember;
import {computedCanAddSpider} from '../services/dispatcher';
import { task, timeout } from 'ember-concurrency';

const LIMIT = 15;
const FILTER_DEBOUNCE = 800;
const TURN_PAGE_DEBOUNCE = 200;

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName:      '',
    spiderSearch: '',
    isFiltering:  false,

    didReceiveAttrs() {
        const spiders = this.get('sortedSpiders').slice(0, LIMIT);
        this._addCurrentSpider(spiders);
        this.set('spiders', spiders);
        this.set('filteredSpiders', this.get('sortedSpiders'));
    },

    // Pagination
    currentPage: 0,
    hasPreviousPage: computed.gte('currentPage', 1),
    hasNextPage: computed('currentPage', 'filteredSpiders.length', function() {
        const max = (this.get('currentPage') + 1) * LIMIT;
        return max < this.get('filteredSpiders.length');
    }),
    pagination: computed('currentSpider', 'currentPage', 'spiders.[]',
                         function() {
        if (this.get('currentSpider')) { return ''; }

        const start = (this.get('currentPage') * LIMIT) + 1;
        const end   = Math.min((this.get('currentPage') + 1) * LIMIT,
                               start + this.get('spiders.length') - 1);
        return `( ${start}-${end} )`;
    }),
    currentSpiderChanged: observer('currentSpider', function() {
        Ember.run.next(() => {
            this._addCurrentSpider(this.get('spiders'));
            this._addCurrentSpider(this.get('filteredSpiders'));
        });
    }),
    turnPage: task(function * (offset) {
        this.set('isFiltering', true);

        yield timeout(TURN_PAGE_DEBOUNCE);

        this.set('isFiltering', false);
        const nextPage = this.get('currentPage') + offset;
        const start = nextPage * LIMIT;
        this.set('spiders',
                 this.get('filteredSpiders').slice(start, start + LIMIT));
        this.set('currentPage', nextPage);
    }).drop(),


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
        }
    },

    _fuzzyFilter(items, term) {
        if (term === '') { return this.get('sortedSpiders'); }

        const fuzzy = new RegExp(term.split('').join('.*'), 'i');
        return items.filter((item) => {
            return fuzzy.exec(item.get('id'));
        });
    },

    _addCurrentSpider(spiders) {
        const currentSpider = this.get('currentSpider');
        if (currentSpider && !spiders.includes(currentSpider)) {
            spiders.pushObject(currentSpider);
        }
    },

    _updateFilter(spiders, term = '') {
        this.set('spiderSearch', term);
        this.set('currentPage',  0);
        this.set('isFiltering',  false);

        this.set('spiders',         spiders.slice(0, LIMIT));
        this.set('filteredSpiders', spiders);
    }
});
