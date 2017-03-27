import Ember from 'ember';
const { inject: { service } } = Ember;

export default Ember.Component.extend({
    tagName: 'span',
    browser: service(),

    actions: {
        reloadPage() {
            this.get('browser').reload();
        }
    }
});
