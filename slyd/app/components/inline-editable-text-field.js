import Ember from 'ember';
import NotificationHandler from '../mixins/notification-handler';

export default Ember.Component.extend(NotificationHandler, {
    tagName: 'div',
    classNames: 'class',
    editing: false,
    validation: '.*',
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
            if (text !== this.get('text')) {
                var error = null;
                this.sendAction('validate', {
                    text: text,
                    setInvalid: (err) => error = err
                });

                var re = new RegExp(this.get('validation'), 'g');
                if (!error && !re.test(text)) {
                    error = '"' + text + '" is not a valid name. Names must match "' + this.get('validation') +'".';
                }

                if(error) {
                    this.set('editing', true);
                    this.showWarningNotification('Validation Error', error);
                } else {
                    this.set('text', text);
                    this.sendAction('action', this.get('text'), this.get('name'));
                }
            }
        }
    }
});
