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
            return Ember.RSVP.all([
                this.get('annotation.field'),
                this.get('annotation.parent.schema.fields')
            ]).then(([currentField, fields]) => {
                if (!fields) {
                    return true;
                }
                fields = fields.reject(f => f === currentField);
                const error = validateFieldName(name, fields);
                if (error) {
                    this.get('notificationManager').showWarningNotification(error);
                }
                return !error;
            });
        },

        addField(name) {
            const annotation = this.get('annotation');
            const schema = annotation.get('field.schema');
            const currentType = annotation.get('type');
            const dispatcher = this.get('dispatcher');

            dispatcher.addNamedField(schema, name, currentType, /* redirect = */false).then(
                field => {
                    annotation.set('field', field);
                    annotation.save();
                });
        },

        changeField() {
            const annotation = this.get('annotation');
            annotation.get('field').then(() => {
                annotation.set('field', annotation.get('field')); // Used to trigger updates
                annotation.save();
            });
        }
    }
});
