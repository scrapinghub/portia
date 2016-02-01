import Ember from 'ember';

export default Ember.Route.extend({
    browser: Ember.inject.service(),

    activate() {
        this.set('browser.url', null);
    }
});
