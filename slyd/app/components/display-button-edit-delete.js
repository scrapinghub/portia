import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',
    classNames: ['row'],
    text: '',
    name: null,

    actions: {
        saveText: function(text, name) {
            if (arguments.length > 0) {
                this.set('text', text);
            }
            this.sendAction('save', this.get('text'), name);
        },

        deleteText: function() {
            this.sendAction('delete', this.get('text'));
        }
    }
});
