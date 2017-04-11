import Ember from 'ember';
const { computed } = Ember;

export default Ember.Component.extend({
    api: Ember.inject.service(),
    notificationManager: Ember.inject.service(),
    hasSpider: computed.bool('spider'),
    isShowingModal: false,

    actions: {
        toggleModal: function() {
            this.toggleProperty('isShowingModal');
        },
    }
});
