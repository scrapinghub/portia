import Ember from 'ember';
import SaveSpiderMixin from '../mixins/save-spider-mixin';

export default Ember.Component.extend(SaveSpiderMixin, {
    routing: Ember.inject.service('-routing'),
    tagName: '',

    spider: null,

    languageConfigOptions: [
        {
            value: false,
            label: "Disable language"
        },
        {
            value: true,
            label: 'Enable language'
        }
    ],

    useLanguageConfig: Ember.computed('spider.useLanguageConfig', {
        get() {
            return this.languageConfigOptions.findBy('value', this.get('spider.useLanguageConfig'));
        },

        set(key, value) {
            this.set('spider.useLanguageConfig', value.value);
            return value;
        }
    }),

    actions: {
        saveSpider() {
            this.saveSpider().then(() => {
                if (this.get('useLanguageConfig.value') === true) {
                    this.get('routing').transitionTo('projects.project.spider.language-options');
                }
            });
        }
    }
});
