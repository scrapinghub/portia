import Ember from 'ember';
const { observer, computed, inject: { service }, run: { next } } = Ember;

export default Ember.Service.extend({
    uiState: service(),
    capabilities: service(),
    project: computed.readOnly('uiState.models.project'),
    versionControlled: computed.readOnly('capabilities.capabilities.version_control'),

    changes: null,
    hasChanges: computed('changes', 'versionControlled', 'hasChanges', {
        get() {
            const changes = this.get('changes');
            const project = this.get('project');
            if (changes === null || (project && this.get('_project_id') !== project.get('id'))) {
                this._checkProjectChanges();
            } else {
                return changes;
            }
        },
        set(_, value) {
            if (this.get('versionControlled') && value) {
                this.set('changes', true);
                return true;
            } else {
                this.set('changes', false);
                return false;
            }
        }
    }),
    _project_id: null,

    init() {
        this._checkProjectChanges();
    },

    projectChanged: observer('project.id', function() {
        if (this.get('project.id') !== this.get('_project_id')) {
            this._checkProjectChanges();
        }
    }),

    _checkProjectChanges() {
        let project = this.get('project');
        if (!(project && this.get('versionControlled'))) { return false; }

        next(this, () => {
            project.status().then(status => {
                const hasChanges = !!(status && status.meta && status.meta.changes &&
                                      status.meta.changes.length);
                this.set('_project_id', this.get('project.id'));
                this.set('changes', hasChanges);
            });
        });
    }
});
