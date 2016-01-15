import Ember from 'ember';

export default Ember.Controller.extend({
    clickHandler: null,

    setClickHandler(fn) {
        this.clickHandler = fn;
    },

    clearClickHandler() {
        this.clickHandler = null;
    },

    actions: {
        viewPortClick() {
            if (this.clickHandler) {
                this.clickHandler(...arguments);
            }
        }
    }
});
