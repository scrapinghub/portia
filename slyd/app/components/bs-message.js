import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'div',
    classNames: 'bs-message',
    classNameBindings: ['bgType'],

    bgType: function() {
        return 'bg-' + (this.get('background') || 'default');
    }.property('type'),
});
