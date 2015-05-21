import Ember from 'ember';
import TextFieldWithButton from '../text-field-with-button';
import NotificationHandler from '../../mixins/notification-handler';

export default TextFieldWithButton.extend(NotificationHandler, {
    actions: {
        sendText: function(text) {
            if (arguments.length > 0 && typeof(text) === 'string') {
                this.set('text', text);
            }
            try {
                new RegExp(this.get('text'));
                this.sendAction('action', this.get('text'));
            } catch (e) {
                this.showWarningNotification('Validation Error',
                                             '"' + this.get('text') + '" ' +
                                             'is not a valid regular expression');
                return;
            }
            if (this.get('reset')) {
                this.$().find('textarea').val('');
                this.$().find('input[type="text"]').val('');
            }
        },
    }
});
