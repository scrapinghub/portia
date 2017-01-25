import Ember from 'ember';
const { computed, run } = Ember;

import { task, timeout } from 'ember-concurrency';
import Changeset from 'ember-changeset';
import lookupValidator from 'ember-changeset-validations';

import { multiplicityFragment } from '../utils/start-urls';
import FixedFragmentValidations from '../validations/fixed-fragment';
import RangeFragmentValidations from '../validations/range-fragment';
import ListFragmentValidations  from '../validations/list-fragment';

import { shortGuid } from '../utils/utils';

const TOOLTIP_DEBOUNCE = 1000;
const TOOLTIP_DELAY = 2000;

const VALIDATIONS = {
    'fixed': FixedFragmentValidations,
    'range': RangeFragmentValidations,
    'list': ListFragmentValidations
};


export default Ember.Component.extend({
    tagName: 'form',
    classNames: ['fragment-form', 'form-inline'],

    toggleTooltip: false,
    fragmentTypes: [
        { value: 'fixed', label: 'Fixed' },
        { value: 'range', label: 'Range' },
        { value: 'list',  label: 'List' }
    ],

    init() {
        this._super(...arguments);
        this.set('uniqueId', shortGuid());
    },

    fragmentType: computed('fragment.type', {
        get() {
            return this.get('fragmentTypes').findBy('value', this.get('fragment.type'));
        },
        set(key, value) {
            this.changeFragmentType(value);
            this.focusFragment();

            return value;
        }
    }),

    changeset: computed('fragment.type', function() {
        const validations = VALIDATIONS[this.get('fragment.type')];
        return new Changeset(
           this.get('fragment'),
           lookupValidator(validations),
           validations
        );
    }),

    isList: computed.equal('fragment.type', 'list'),
    isRange: computed.equal('fragment.type', 'range'),

    listPlaceholder: computed('isList', function() {
        return this.get('isList') ? 'val1 val2 val3' : '';
    }),

    multiplicity: computed('fragmentType', 'fragment.value', function() {
        return multiplicityFragment(this.get('fragment'));
    }),

    limits() {
        const limits = this.get('changeset.value').split('-');
        return limits.length !== 2 ? ['', ''] : limits;
    },
    lower: computed('isRange', 'changeset.value', {
        get() {
            return this.limits()[0];
        },
        set(key, value) {
            this.updateLimit(value, 0);
            return value;
        }
    }),
    higher: computed('isRange', 'changeset.value', {
        get() {
            return this.limits()[1];
        },
        set(key, value) {
            this.updateLimit(value, 1);
            return value;
        }
    }),

    // helpers
    updateFragment() {
        this.saveChangeset();
        this.set('toggleTooltip', false);
        this.get('flashTooltip').perform();
        this.set('fragment.valid', this.get('changeset.isValid'));
    },

    updateLimit(value, index) {
        let limits = this.limits();
        limits[index] = value;

        const changeset = this.get('changeset');
        changeset.set('value', limits.join('-'));

        this.updateFragment();
    },

    changeFragmentType(value) {
        this.set('fragment.value', '');
        this.set('fragment.valid', true);
        this.set('fragment.type', value.value);
    },

    focusFragment() {
        run.scheduleOnce('afterRender', this.context, () => {
            this.$('.focus-control').focus();
        });
    },

    saveChangeset() {
        const changeset = this.get('changeset');

        if (changeset.get('value') === '') {
            changeset.set('value', '');
        }

        if (changeset.get('isValid')) {
            changeset.save();
        }
    },

    flashTooltip: task(function * () {
        yield timeout(TOOLTIP_DEBOUNCE);

        if (this.get('changeset.isInvalid')) {
            this.set('toggleTooltip', true);
            yield timeout(TOOLTIP_DELAY);
            this.set('toggleTooltip', false);
        }
    }).restartable(),

    actions: {
        saveFragment() {
            this.updateFragment();

            if (this.get('changeset.isValid') && this.get('allValidFragments')) {
                this.get('saveSpider').perform();
            }
        },

        updateValue() {
            this.updateFragment();
        },

        changeFragmentType() {
            this.get('saveSpider').cancelAll();
        }
    }
});
