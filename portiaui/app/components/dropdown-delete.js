import Ember from 'ember';
const { computed } = Ember;

export default Ember.Component.extend({
    tagName: 'li',
    classNames: ['dropdown-delete'],
    classNameBindings: ['isConfirmed'],
    isConfirmed: false,

    notConfirmed: computed.not('isConfirmed'),

    actions: {
        onDelete() {
            if (this.get('notConfirmed')) {
                this.set('isConfirmed', true);
            } else {
                this.get('onDelete')();
            }
        }
    }
});
