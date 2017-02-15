import Ember from 'ember';

export default Ember.Component.extend({
    classNameBindings: ['list-item-spider-train', 'disabled', 'hasAction'],

    bubbles: true,
    disabled: false,

    hasAction: Ember.computed.bool('action'),

    click() {
        if (this.attrs.action && !this.get('disabled')) {
            this.attrs.action();
            if (!this.get('bubbles')) {
                return false;
            }
        }
    },

});
