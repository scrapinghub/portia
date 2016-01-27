import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    spider: null,

    actions: {
        save() {
            this.get('spider').save();
        }
    }
});
