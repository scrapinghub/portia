import Ember from 'ember';
const { computed } = Ember;
import { getColors } from '../utils/colors';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    fragments: computed.alias('startUrl.fragments'),

    fragmentColors: computed('fragments.[]', function() {
        return getColors(this.get('fragments.length'));
    }),
    rawColors: computed.mapBy('fragmentColors', 'main'),

    generatedUrlLists: computed('fragments.@each.type', 'fragments.@each.value', function() {
        return this.get('startUrl').generateList();
    }),

    actions: {
        addFragment() {
            this.get('dispatcher').addFragment(this.get('startUrl'));
        },

        removeFragment(fragment) {
            this.get('dispatcher').removeFragment(this.get('startUrl'), fragment);
        }
    }
});
