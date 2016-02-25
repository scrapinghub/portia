import Ember from 'ember';

export default Ember.Component.extend({
    capabilities: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',
    
    dashUrl: Ember.computed.readOnly('capabilities.custom.dash_url'),
    portiaStableUrl: Ember.computed.readOnly('capabilities.custom.portia_stable_url'),
    currentProject: Ember.computed.readOnly('uiState.models.project')
});
