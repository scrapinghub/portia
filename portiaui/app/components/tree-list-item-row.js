import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['tree-list-item-row'],

    mouseEnter() {
        if (this.attrs.onMouseEnter && this.attrs.onMouseEnter.call) {
            this.attrs.onMouseEnter(...arguments);
        }
    },

    mouseLeave() {
        if (this.attrs.onMouseLeave && this.attrs.onMouseLeave.call) {
            this.attrs.onMouseLeave(...arguments);
        }
    }
});
