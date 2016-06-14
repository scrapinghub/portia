import Ember from 'ember';
const { computed } = Ember;
import { multiplicityFragment } from '../utils/start-urls';

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

    multiplicity: computed('fragment.type', 'fragment.value', function() {
        return multiplicityFragment(this.get('fragment'));
    }),
    fragmentType: computed('fragment.type', {
        get() {
            return this.fragmentTypeOptions.findBy('value', this.get('fragment.type'));
        },
        set(key, value) {
            this.set('fragment.type', value.value);
            return value;
        }
    }),

    actions: {
        removeFragment(fragment) {
            console.log('Removing Fragment', fragment);
        }
    }
});
