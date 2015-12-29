import Ember from 'ember';

export default Ember.Component.extend({
    uiState: Ember.inject.service(),

    tagName: 'main',
    classNameBindings: ['slideRight'],

    slideRight: Ember.computed.bool('uiState.slideMain')
});
