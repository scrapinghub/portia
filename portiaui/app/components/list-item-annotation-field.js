import Ember from 'ember';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    annotation: null,

    actions: {
        addField(name) {
            const annotation = this.get('annotation');
            const schema = annotation.get('field.schema');
            const currentType = annotation.get('type');
            const field = this.get('dispatcher').addNamedField(
                schema, name, currentType, /* redirect = */false);
            annotation.set('field', field);
            annotation.save();
        },

        changeField() {
            const annotation = this.get('annotation');
            annotation.save();
        }
    }
});
