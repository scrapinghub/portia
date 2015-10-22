import Ember from 'ember';
import { FIELD_TYPES } from '../models/field';


export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    types: FIELD_TYPES,

    cannotDeleteField: Ember.computed.gt('field.annotations.length', 0),
    field: Ember.computed.readOnly('item.content'),

    actions: {
        removeField() {
            const field = this.get('field');
            this.get('dispatcher').removeField(field);
        },

        saveField() {
            const field = this.get('field');
            field.save();
        }
    }
});
