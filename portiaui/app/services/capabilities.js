import Ember from 'ember';

export default Ember.Service.extend({
    ajax: Ember.inject.service(),

    fetchCapabilities: Ember.on('init', function() {
        this.get('ajax').request('/server_capabilities').then(capabilities => {
            this.setProperties(capabilities);
        }, () => {
            Ember.run.later(this, this.fetchCapabilities, 5000);
        });
    })
});
