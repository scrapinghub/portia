import Ember from 'ember';

export default Ember.Component.extend({
    attributeBindings: ['type', 'value', 'style'],
    classNames: ['offset-checkbox'],
    tagName: 'input',
    type: 'checkbox',
    checked: false,
    disabled: false,

    initState: function() {
        this.$().prop('checked', this.get('checked'));
        this.$().prop('disabled', this.get('disabled'));

    }.on('didInsertElement'),

    _updateElementValue: function() {
        this.set('checked', this.$().prop('checked'));
    },

    change: function(){
        this._updateElementValue();
        this.sendAction('action', this.get('value'), this.get('checked'), this.get('name'));
    }
});
