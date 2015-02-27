import Ember from 'ember';

export default Ember.Component.extend({
    openOnLeft: true,
    tagName: 'ul',
    classNames: 'breadcrumbs',

    actions: {
        clicked: function(breadcrumb) {
            this.sendAction('clicked', breadcrumb);
        },

        hovered: function(breadcrumb, index, hovered) {
            this.sendAction('elementHovered', breadcrumb, index, hovered);
        }
    }
});
