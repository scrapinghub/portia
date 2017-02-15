import Ember from 'ember';
import SaveSpiderMixin from '../mixins/save-spider-mixin';

export default Ember.Component.extend(SaveSpiderMixin, {
    routing: Ember.inject.service('-routing'),
    tagName: '',

    spider: null,

    currencyConfigOptions: [
        {
            value: false,
            label: "Disable Currency"
        },
        {
            value: true,
            label: 'Enable Currency'
        }
    ],

    useCurrencyConfig: Ember.computed('spider.useCurrencyConfig', {
        get() {
            return this.currencyConfigOptions.findBy('value', this.get('spider.useCurrencyConfig'));
        },

        set(key, value) {
            this.set('spider.useCurrencyConfig', value.value);
            return value;
        }
    }),

    actions: {
        saveSpider() {
            this.saveSpider().then(() => {
                if (this.get('useCurrencyConfig.value') === true) {
                    this.get('routing').transitionTo('projects.project.spider.currency-options');
                }
            });
        }
    }
});
