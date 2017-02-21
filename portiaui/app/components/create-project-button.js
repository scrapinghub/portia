import Ember from 'ember';
const { computed, inject: { service } } = Ember;

export default Ember.Component.extend({
    dispatcher: service(),
    capabilities: service(),
    tagName: '',

    canCreateProjects: computed.readOnly('capabilities.capabilities.create_projects'),
    projectName: null,

    actions: {
        addProject() {
            this.get('dispatcher').addProject(this.get('projectName'), /* redirect = */true);
        }
    }
});
