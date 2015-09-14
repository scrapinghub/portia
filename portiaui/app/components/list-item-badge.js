import Ember from 'ember';

export default Ember.Component.extend({
    tagName: '',

    color: null,
    count: 0,

    badgeStyle: Ember.computed('color.main', function() {
        var color = this.get('color.main');
        return Ember.String.htmlSafe(color ? `background-color: ${color};` : '');
    })
});
