import Ember from 'ember';

export default Ember.Service.extend({
    ajax: Ember.inject.service(),
    
    init() {
        this._super(...arguments);
        this.get('ajax').request('/server_capabilities').then(capabilities => {
            this.setProperties(capabilities);
        });
    }
});
