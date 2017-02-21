import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    icon: null,

    actions: {
        clickIcon() {
            const action = this.get('onClick');
            if (action) { action(); }
        }
    }
});
