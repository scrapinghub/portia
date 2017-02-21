import Ember from 'ember';
const { computed, inject: { service } } = Ember;

export default Ember.Component.extend({
    browser: service(),

    disableLinks: computed.readOnly('browser.invalidUrl'),
    spider: null,

    actions: {
        toggleShowLinks() {
            const spider = this.get('spider');
            spider.toggleProperty('showLinks');
            spider.save();
        }
    }
});
