import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'input',
    type: 'text',
    value: '',
    name: null,
    width: null,
    placeholder: null,
    clear: false,
    attributeBindings: ['type', 'disabled', 'placeholder', 'style', 'value'],
    classNames: ['form-control', 'input-sm'],

    setValue: function() {
        if (this.get('value')) {
            this.get('element').value = this.get('value');
        }
    }.on('didInsertElement'),

    style: function() {
        var width = this.get('width');
        if (width) {
            return 'width:' + width + ';';
        }
        return '';
    }.property('width'),

    keyUp: function(e) {
        if (e.which === 13) {
            this.sendAction('action', this.get('element').value, this.get('name'));
            if (this.get('clear')) {
                this.get('element').value = '';
                this.set('clear', false);
            }
        }
        this.change();
    },

    focusOut: function() {
        if (this.get('saveOnExit') && this.get('element')) {
            this.sendAction('action', this.get('element').value, this.get('name'));
        }
    },

    change: function() {
        if (this.get('element')) {
            this.sendAction('update', this.get('element').value, this.get('name'));
        }
    },

    didInsertElement: function() {
        this._super();
        this.$().focus();
    }
});
