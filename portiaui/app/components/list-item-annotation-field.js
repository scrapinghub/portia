import Ember from 'ember';
import {validateFieldName} from './schema-structure-listing';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),
    notificationManager: Ember.inject.service(),

    tagName: '',

    annotation: null,
    selecting: false,

    actions: {
        validateFieldName(name) {
            const fields = this.get('annotation.field.schema.fields');
            const error = validateFieldName(name, fields);
            if (error) {
                this.get('notificationManager').showWarningNotification(error);
            }
            return !error;
        },

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
