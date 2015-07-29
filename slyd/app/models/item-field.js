import SimpleModel from './simple-model';

export default SimpleModel.extend({
    serializedProperties: ['name', 'type', 'required', 'vary', 'display_name'],
    type: 'text',
    required: false,
    vary: false,

    _create_display_name: function() {
        this.set('display_name', this.get('fieldName'));
    }.on('init'),

    fieldName: function() {
        return this.getWithDefault('display_name', this.get('name'));
    }.property('name', 'display_name')
});
