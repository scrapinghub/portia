import Ember from 'ember';


export default Ember.Component.extend({
    tagName: 'i',
    classNames: ['overlay-icon'],

    click() {
        if (this.attrs.click) {
            this.attrs.click();
        }
    },

    mouseEnter() {
        if (this.attrs.mouseEnter) {
            this.attrs.mouseEnter();
        }
    },

    mouseLeave() {
        if (this.attrs.mouseLeave) {
            this.attrs.mouseLeave();
        }
    }
});
