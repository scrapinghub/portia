import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    field: null,

    actions: {
        save() {
            this.get('field').save();
        }
    }
});
