import BaseRoute from './base-route';

export default BaseRoute.extend({
    model: function(params) {
        if (params.project_id) {
            this.set('slyd.project', params.project_id);
        }
        return this.get('slyd').editProject(params.project_id, 'master');
    },
});
