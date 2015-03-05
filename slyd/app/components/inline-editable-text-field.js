import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',
    classNames: 'class',
    editing: false,
    validation: '*',
    text: '',
    name: null,

    click: function() {
        if (!this.get('editing')) {
            this.set('editing', true);
            Ember.run.later(function() {
                var input = Ember.$(this.get('element')).find('input');
                input.focus();
                var value = input.val();
                input.val('').val(value);
            }.bind(this), 300);
        }
    },

    actions: {
        update: function(text) {
            this.set('editing', false);
            if (Ember.$.trim(text).length < 1) {
                return;
            }
            var re = new RegExp(this.get('regex'), 'g');
            if (text !== this.get('text') && re.test(text)) {
                this.set('text', text);
                this.sendAction('action', this.get('text'), this.get('name'));
            } else {
                this.sendAction('showAlert', 'Validation Error',
                    '"' + text + '" is not a valid name. Names must match "' + this.get('validation') +'".',
                    function() { this.set('editing', true);}.bind(this));
            }
        }
    }
});
