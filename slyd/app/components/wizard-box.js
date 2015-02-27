import Ember from 'ember';

export default Ember.Component.extend({
    text: '',
    defaultValue: '',

    noText: function() {
        return this.get('text').length < 1;
    }.property('text'),

    actions: {
        add: function() {
            if (!this.get('noText')) {
                this.sendAction('action', this.get('text'));
            }
        },

        update: function(text) {
            if (text) {
                this.set('text', text.trim());
            }
        }
    }
});
