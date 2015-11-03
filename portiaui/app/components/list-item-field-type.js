import Ember from 'ember';
import { FIELD_TYPES } from '../models/field';

export default Ember.Component.extend({
    tagName: '',

    field: null,

    types: FIELD_TYPES,

    actions: {
        saveField() {
            const field = this.get('field');
            field.save();
        }
    }
});
