import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    actions: {
        addField() {
            this.get('dispatcher').addField(this.get('schema'), undefined, /* redirect = */true);
        },

        removeField(field) {
            this.get('dispatcher').removeField(field);
        },

        saveField(field) {
            field.save();
        }
    }
});
