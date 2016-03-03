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
                this.get('annotation.field.schema.fields')
            ]).then(([currentField, fields]) => {
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

            Ember.RSVP.all([
                dispatcher.addNamedField(schema, name, currentType, /* redirect = */false),
                annotation.get('field'),
            ]).then(([newField, oldField]) => {
                annotation.set('field', newField);
                annotation.save().then(() => {
                    if(annotation.get('_autoCreatedField') && oldField.get('_autoCreatedBy') &&
                       annotation.get('_autoCreatedField.id') === oldField.get('id')) {
                        oldField.destroyRecord();
                    }
                    annotation.set('_autoCreatedField', null);
                });
            });
        },

        changeField() {
            const annotation = this.get('annotation');
            const field = annotation.get('field');
            annotation.set('field', field);

            annotation.save().then((annotation) => {
                if(field.get('_autoCreatedBy')) {
                    field.set('_autoCreatedBy._autoCreatedField', null);
                }
                if(annotation.get('_autoCreatedField')) {
                    if(annotation.get('_autoCreatedField.id') !== annotation.get('field.id')) {
                        annotation.get('_autoCreatedField').destroyRecord();
                        annotation.set('_autoCreatedField', null);
                    }
                }
            });
        }
    }
});
