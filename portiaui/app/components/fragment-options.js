import Ember from 'ember';
const { computed } = Ember;
import { multiplicityFragment } from '../utils/start-urls';

const VALID_RANGE = /^\d+-\d+$/;

export default Ember.Component.extend({
    tagName: 'form',
    classNames: ['fragment-form', 'form-inline'],

    fragmentTypeOptions: [
        {
            value: 'fixed',
            label: 'Fixed'
        },
        {
            value: 'range',
            label: 'Range'
        },
        {
            value: 'list',
            label: 'List'
        }
    ],

    getLimits() {
        let fragmentValue = this.get('fragment.value');

        if (fragmentValue.match(/\d*-\d*/)) {
            return this.get('fragment.value').split('-');
        } else {
            return ["", ""];
        }
    },

    fragmentType: computed('fragment.type', {
        get() {
            return this.fragmentTypeOptions.findBy('value', this.get('fragment.type'));
        },
        set(key, value) {
            this.set('fragment.type', value.value);
            return value;
        }
    }),
    multiplicity: computed('fragmentType', 'fragment.value', function() {
        return multiplicityFragment(this.get('fragment'));
    }),

    isList: computed.equal('fragment.type', 'list'),
    listPlaceholder: computed('isList', function() {
        return this.get('isList') ? 'val1 val2 val3' : '';
    }),

    isRange: computed.equal('fragment.type', 'range'),
    lower: computed('isRange', 'fragment.value', {
        get() {
            return this.getLimits()[0];
        },
        set(key, value) {
            const limits = this.getLimits();
            limits[0] = value;
            if (!limits[1] || limits[0] !== limits[1]) {
                limits[1] = value;
            }
            this.set('fragment.value', limits.join('-'));
            return value;
        }
    }),
    higher: computed('isRange', 'fragment.value', {
        get() {
            return this.getLimits()[1];
        },
        set(key, value) {
            const limits = this.getLimits();
            limits[1] = value;
            this.set('fragment.value', limits.join('-'));
            return value;
        }
    }),

    saveRange() {
        if (VALID_RANGE.exec(this.get('fragment.value'))) {
            this.get('saveSpider')();
        }
    },

    actions: {
        saveFragment() {
            if (this.get('isRange')) {
                this.saveRange();
            } else {
                this.get('saveSpider')();
            }
        }
    }
});
