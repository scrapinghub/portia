import Ember from 'ember';

export default Ember.Controller.extend({
    browser: Ember.inject.service(),

    queryParams: ['url', 'baseurl'],

    url: Ember.computed.alias('browser.url'),
    baseurl: Ember.computed.alias('browser.baseurl'),
    clickHandler: null,

    setClickHandler(fn) {
        this.clickHandler = fn;
    },

    clearClickHandler() {
        this.clickHandler = null;
    },

    actions: {
        viewPortClick() {
            if (this.clickHandler) {
                this.clickHandler(...arguments);
            }
        }
    }
});
