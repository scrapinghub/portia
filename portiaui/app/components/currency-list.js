import Ember from 'ember';
import SaveSpiderMixin from '../mixins/save-spider-mixin';

export default Ember.Component.extend(SaveSpiderMixin, {
    tagName: '',

    spider: null,

    currencyCodeOptions: [
        {
            value: 'EGP',
            label: 'Egyptian Pound'
        },
        {
            value: 'SAR',
            label: "Saudi Riyal"
        },
        {
            value: 'AED',
            label: "United Arab Emirates Dirham"
        },
        {
            value: 'KES',
            label: "Kenyan Shilling"
        },
        {
            value: 'NGN',
            label: "Nigerian naira"
        },
        {
            value: 'USD',
            label: "US Dollar"
        },
    ],

    currencyCode: Ember.computed('spider.currencyCode', {
        get() {
            return this.currencyCodeOptions.findBy('value', this.get('spider.currencyCode'));
        },

        set(key, value) {
            this.set('spider.currencyCode', value.value);
            return value;
        }
    }),

    actions: {
        saveSpider() {
            this.saveSpider();
        }
    }
});
