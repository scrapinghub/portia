import Ember from 'ember';

export default Ember.Mixin.create({
    uiState: Ember.inject.service(),

    activate() {
        this.set('uiState.slideMain', true);
    },

    deactivate() {
        this.set('uiState.slideMain', false);
    }
});
