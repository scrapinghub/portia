import Ember from 'ember';

export default Ember.Component.extend({
    tagName: 'li',
    classNames: ['tree-list-item'],

    hasChildren: false,

    didInsertElement() {
        const $row = this.$('.tree-list-item-row').eq(0);
        $row.on({
            'mouseenter.portia.portia-tree-list-item': event => {
                if (this.attrs['mouse-enter'] && this.attrs['mouse-enter'].call) {
                    this.attrs['mouse-enter'](event);
                }
            },
            'mouseleave.portia.portia-tree-list-item': event => {
                if (this.attrs['mouse-leave'] && this.attrs['mouse-leave'].call) {
                    this.attrs['mouse-leave'](event);
                }
            }
        });
    },

    willDestroyElement() {
        const $row = this.$('.tree-list-item-row').eq(0);
        $row.off('.portia-tree-list-item');
    }
});
