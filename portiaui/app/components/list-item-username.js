import Ember from 'ember';
import SaveSpiderMixin from '../mixins/save-spider-mixin';

export default Ember.Component.extend(SaveSpiderMixin, {
    tagName: '',

    spider: null,

    usernameOptions: [
        {
            value: '',
            label: "Choose your username"
        },
        {
            value: 'mina',
            label: 'mina'
        },
        {
            value: 'nagy',
            label: 'nagy'
        }
    ],

    username: Ember.computed('spider.username', {
        get() {
            return this.usernameOptions.findBy('value', this.get('spider.user'));
        },

        set(key, value) {
            this.set('spider.username', value.value);
            return value;
        }
    }),

    actions: {
        saveSpider() {
            this.saveSpider();
        }
    }
});
