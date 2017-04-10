import Ember from 'ember';
import SaveSpiderMixin from '../mixins/save-spider-mixin';

export default Ember.Component.extend(SaveSpiderMixin, {
    tagName: '',

    spider: null,

    countryCodeOptions: [
        {
            value: '',
            label: "Choose a country from list"
        },
        {
            value: 'eg',
            label: 'Egypt'
        },
        {
            value: 'sa',
            label: "Saudi Arabia"
        },
        {
            value: 'ae',
            label: "UAE"
        },
        {
            value: 'ke',
            label: "Kenya"
        },
        {
            value: 'ng',
            label: "Nigeria"
        },
    ],

    countryCode: Ember.computed('spider.countryCode', {
        get() {
            return this.countryCodeOptions.findBy('value', this.get('spider.countryCode'));
        },

        set(key, value) {
            this.set('spider.countryCode', value.value);
            return value;
        }
    }),

    actions: {
        saveSpider() {
            this.saveSpider();
        }
    }
});
