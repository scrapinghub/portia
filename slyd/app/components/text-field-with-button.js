import Ember from 'ember';

export default Ember.Component.extend({
    outerClasses: ['row'],
    tagName: 'div',
    classNames: this.outerClasses,
    text: null,
    placeholder: '',

    disabled: function() {
        return Ember.$.trim(this.get('text')).length < 1;
    }.property('text'),

    setValue: function() {
        this.$().find('textarea').val(this.get('data'));
        this.set('text', this.get('data'));
    }.observes('data'),

    actions: {
        sendText: function(text) {
            if (arguments.length > 0 && typeof(text) === 'string') {
                this.set('text', text);
            }
            this.sendAction('action', this.get('text'));
            if (this.get('reset')) {
                this.$().find('textarea').val('');
                this.$().find('input[type="text"]').val('');
            }
        },

        updateText: function(text) {
            this.set('text', text);
        }
    }
});
