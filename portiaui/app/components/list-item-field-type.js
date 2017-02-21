import Ember from 'ember';
import { FIELD_TYPES } from '../models/field';
import ensurePromise from '../utils/ensure-promise';

export default Ember.Component.extend({
    tagName: '',

    field: null,

    types: FIELD_TYPES,

    actions: {
        saveField() {
            const field = this.get('field');
            ensurePromise(field).then(field => {
                if (!!field) {
                    field.save();
                }
            });
        }
    }
});
