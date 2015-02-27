import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',
    classNames: ['row'],
    text: '',

    actions: {
        saveText: function(text) {
            if (arguments.length > 0) {
                this.set('text', text);
            }
            this.sendAction('save', this.get('text'));
        },

        deleteText: function() {
            this.sendAction('delete', this.get('text'));
        }
    }
});
