import Ember from 'ember';

export default Ember.Component.extend({
    attributeBindings: ['content'],
    tagName: 'span',
    classNames: 'label',
    classNameBindings: ['labelType'],

    labelType: function() {
        return 'label-' + this.getWithDefault('type', 'default');
    }.property('type')
});
