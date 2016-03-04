import Ember from 'ember';

export default Ember.Component.extend({
    capabilities: Ember.inject.service(),
    cookieMonster: Ember.inject.service(),
    uiState: Ember.inject.service(),

    tagName: '',

    dashUrl: Ember.computed.readOnly('capabilities.custom.dash_url'),
    portiaStableUrl: Ember.computed.readOnly('capabilities.custom.portia_stable_url'),
    currentProject: Ember.computed.readOnly('uiState.models.project'),

    actions: {
        setPreference() {
            const cookieName = this.get('capabilities.custom.version_cookie_name');
            const cookieDomain = this.get('capabilities.custom.cookie_domain');
            if (cookieName && cookieDomain) {
                cookie.set(cookieName, 'stable', {
                    expires: 365,
                    domain: cookieDomain
                });
            }
        }
    }
});
