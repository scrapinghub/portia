import BaseRoute from './base-route';

export default BaseRoute.extend({
    beforeModel: function(s) {
        if (s.params.project.project_id) {
            this.set('slyd.project', s.params.project.project_id);
            return this.get('slyd').editProject(s.params.project.project_id, 'master');
        }
    },

    model: function() {
        return this.get('slyd').getSpiderNames();
    }
});
