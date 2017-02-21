import Ember from 'ember';
const { computed } = Ember;
import { getColors } from '../utils/colors';
import { multiplicityFragment } from '../utils/start-urls';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    rawColors: computed.mapBy('fragmentColors', 'main'),
    fragments: computed.alias('startUrl.fragments'),

    allValidFragments: computed('fragments.@each.valid', function() {
      return this.get('fragments').reduce((a, b) => {
        return (a.valid === undefined || a.valid) &&
               (b.valid === undefined || b.valid);
      });
    }),
    generatedUrlLists: computed('fragments.@each.type', 'fragments.@each.value', function() {
        return this.get('startUrl').generateList();
    }),

    fragmentColors: computed('fragments.[]', function() {
        return getColors(this.get('fragments.length'));
    }),
    isComplete: computed('generatedUrlLists', '_fragmentCount', function() {
        return this.get('generatedUrlLists.length') === this.get('_fragmentCount');
    }),

    actions: {
        addFragment() {
            this.get('dispatcher').addFragment(this.get('startUrl'));
            this.get('saveSpider').perform();
        },

        removeFragment(fragment) {
            this.get('dispatcher').removeFragment(this.get('startUrl'), fragment);
            this.get('saveSpider').perform();
        }
    },

    _fragmentCount: computed('fragments.@each.type',
                             'fragments.@each.value', function() {
        return this.get('fragments')
                   .map(multiplicityFragment)
                   .reduce((a,b) => a * b);
    })
});
