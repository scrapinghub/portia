import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'a',

    click: function() {
        this.get('actionData.controller').transitionToRoute('items');
        this.sendAction('clicked');
    }
});
