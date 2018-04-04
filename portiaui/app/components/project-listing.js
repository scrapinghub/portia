import Ember from 'ember';
const { computed, inject: { service } } = Ember;

export default Ember.Component.extend({
    capabilities: service(),
    changes: service(),
    notificationManager: service(),

    tagName: '',
    project: null,
    isNoticed: false,

    deployable: computed.readOnly('capabilities.capabilities.deploy_projects'),
    versionControlled: computed.readOnly('capabilities.capabilities.version_control'),
    notVersionControlled: computed.not('versionControlled'),
    hasChanges: computed.readOnly('changes.hasChanges'),
    hasNoChanges: computed.not('hasChanges'),
    notPublished: computed.or('hasNoChanges', 'notVersionControlled'),
    isPublished: computed.not('notPublished'),
    notNoticed: computed.not('isNoticed'),
    isPulsing: computed.and('hasChanges', 'notNoticed'),

    downloadUrl: computed('project', function() {
        const link = this.get('project._internalModel._links.self');
        return `${link}/download`;
    }),
    downloadCodeUrl: computed('downloadUrl', function() {
        return `${this.get('downloadUrl')}?format=code`;
    }),

    actions: {
        deploy() {
            this.get('project').deploy().then(data => {
                // Show user message and allow them to schedule spider
                this.get('notificationManager').showNotification(
                    data.meta.title);
            }, data => {
                let error = data.errors[0];
                if (error.status > 499) {
                    throw data;
                }
                this.get('notificationManager').showNotification(error.title, error.detail);
                if (error.status === 409) {
                    this.sendAction('conflict');
                }
            });
        },

        publish() {
            this.get('project').publish().then(data => {
                // Show user message and allow them to schedule spider
                this.get('notificationManager').showNotification(
                    data.meta.title);
            }, data => {
                let error = data.errors[0];
                if (error.status > 499) {
                    throw data;
                }
                this.get('notificationManager').showNotification(error.title, error.detail);
                if (error.status === 409) {
                    this.sendAction('conflict');
                }
            });
        },

        discard() {
            this.get('project').reset().then(() => {
                this.sendAction('reload');
            }, data => {
                let error = data.errors[0];
                if (error.status > 499) {
                    throw data;
                }
                this.get('notificationManager').showNotification(error.title, error.detail);
            });

        },

        clickProjectOptions() {
            this.set('isNoticed', true);
        }
    }
});
