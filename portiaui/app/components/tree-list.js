import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'ul',
    classNames: ['tree-list'],
    classNameBindings: ['collapsed:hide'],
    listKey: '@index'
});
