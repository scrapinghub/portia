import Ember from 'ember';
const { observer, computed, inject: { service }, run: { next } } = Ember;

export default Ember.Service.extend({
    uiState: service(),
    project: computed.readOnly('uiState.models.project'),

    hasChanges: null,
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
        if (!project) { return false; }

        next(this, () => {
            project.status().then(status => {
                const hasChanges = !!(status && status.meta && status.meta.changes &&
                                      status.meta.changes.length);
                this.set('_project_id', this.get('project.id'));
                this.set('hasChanges', hasChanges);
            });
        });
    }
});
