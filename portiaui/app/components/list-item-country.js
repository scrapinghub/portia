import Ember from 'ember';
import SaveSpiderMixin from '../mixins/save-spider-mixin';

export default Ember.Component.extend(SaveSpiderMixin, {
    tagName: '',

    spider: null,

    countryCodeOptions: [
        {
            value: 'EG',
            label: 'Egypt'
        },
        {
            value: 'SA',
            label: "Saudi Arabia"
        },
        {
            value: 'AE',
            label: "UAE"
        },
        {
            value: 'KE',
            label: "Kenya"
        },
        {
            value: 'NG',
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
