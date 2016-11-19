import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    actions: {
        onClick() {
            const action = this.get('onClick');
            if (action) {
                action();
            }
        }
    }
});
