import Ember from 'ember';

export default Ember.Object.extend({
    fieldName: null,
    extractors: [],
    required: false,
    extracted: false,
    disabled: true,
});
