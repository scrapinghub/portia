import Ember from 'ember';

export default Ember.Component.extend({
    classNames: ['structure-list-item'],

    addOpen: false,

    actions: {
        addClicked() {
            if (this.attrs.add && !this.get('addDisabled')) {
                this.attrs.add();
            }
        },

        addHovered() {
            if (this.attrs.add && !this.get('addDisabled')) {
                this.set('addOpen', true);
            }
        },

        removeClicked() {
            if (this.attrs.remove && !this.get('removeDisabled')) {
                this.attrs.remove();
            }
        }
    }
});
