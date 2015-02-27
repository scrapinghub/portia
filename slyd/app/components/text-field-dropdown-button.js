import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',
    bindAttributes: ['class'],
    options: [],
    placeholder: '',

    actions: {
        save: function(text) {
            if (arguments.length > 0 && typeof(text) === 'string') {
                this.set('text', text);
            }
            this.sendAction('action', this.get('text'), this.get('option'));
            if (this.get('reset')) {
                this.$().find('textarea').val('');
                this.$().find('input[type="text"]').val('');
            }
        },

        updateText: function(text) {
            this.set('text', text);
        },

        updateOption: function(option) {
            this.set('option', option);
        }
    }
});
