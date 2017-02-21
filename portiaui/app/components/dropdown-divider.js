import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'li',
    classNames: ['divider'],
    attributeBindings: ['role'],
    role: 'separator'
});
