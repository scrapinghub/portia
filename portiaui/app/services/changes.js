import Ember from 'ember';
const { computed, inject: { service }, run: { next } } = Ember;

export default Ember.Service.extend({
    capabilities: service(),
    uiState: service(),
    project: computed.readOnly('uiState.models.project'),
    _project: null,
    changes: null,

    hasChanges: computed('uiState.models.project.id', 'changes', function() {
        if (this.get('project.id') !== this.get('_project')) {
            let project = this.get('project');
            if (!project) {
                return false;
            }
            return next(this, () => {
                project.status().then(status => {
                    const hasChanges = !!(status && status.meta && status.meta.changes &&
                                          status.meta.changes.length);
                    this.set('_project', this.get('project.id'));
                    this.set('changes', hasChanges);
                    return hasChanges;
                });
            });
        }
        return this.get('changes');
    })
});
