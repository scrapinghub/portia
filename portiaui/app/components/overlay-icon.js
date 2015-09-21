import Ember from 'ember';


export default Ember.Component.extend({
    tagName: 'i',
    classNames: ['overlay-icon'],

    click() {
        if (this.attrs.click) {
            this.attrs.click();
        }
    }
});
