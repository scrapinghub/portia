import Ember from 'ember';
const { computed } = Ember;

export default Ember.Component.extend({
    tagName: 'span',
    attributeBindings: ['colorStyle:style'],
    colorStyle: computed('color.main', function() {
        var color = this.get('color.main');
        return Ember.String.htmlSafe(color ? `color: ${color};` : '');
    })
});
