import Ember from 'ember';

export default Ember.Controller.extend({
    actions: {
        closeOptions() {
            this.send('close');
        }
    }
});
