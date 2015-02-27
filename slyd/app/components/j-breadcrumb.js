import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'li',
    classNames: 'breadcrumbs',
    attributeBindings: 'title',
    html: true,

    label: function() {
        return this.get('info.label');
    }.property('info.label', 'info'),

    click: function() {
        this.sendAction('clicked', this.get('info'));
    },

    mouseEnter: function() {
        this.set('info.showFull', true);
        this.sendAction('hovered', this.get('info'), this.get('index'), true);
    },

    mouseLeave: function() {
        this.set('info.showFull', false);
        this.sendAction('hovered', this.get('info'), this.get('index'), false);
    },
});
