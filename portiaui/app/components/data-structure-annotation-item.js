import Ember from 'ember';
import { ICON_CLASSES } from './structure-list-item';
import { FIELD_TYPES } from '../models/field';


export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    iconClasses: ICON_CLASSES,
    renaming: false,
    types: FIELD_TYPES,

    annotation: Ember.computed.readOnly('item.content'),

    actions: {
        addField(setAction) {
            const currentType = this.get('annotation.type');
            const schema = this.get('annotation.parent.schema');
            const field = this.get('dispatcher').addField(
                schema, currentType, /* redirect = */false);
            setAction(field);
        },

        cancelRenaming() {
            this.set('renaming', false);
        },

        removeAnnotation() {
            const annotation = this.get('annotation');
            this.get('dispatcher').removeAnnotation(annotation);
        },

        renameField() {
            this.set('renaming', true);
        },

        saveAnnotation() {
            const annotation = this.get('annotation');
            annotation.save();
        },

        saveField() {
            const field = this.get('annotation.field');
            this.set('renaming', false);
            field.save();
        }
    }
});
