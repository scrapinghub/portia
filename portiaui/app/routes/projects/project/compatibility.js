import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        return params;
    },

    redirect({path}) {
        // conflicts route has the same path
        if (path === 'items') {
            this.transitionTo('projects.project');
            return;
        }
        const fragments = path.split('/');
        if (fragments.length === 1) {
            this.transitionTo('projects.project.spider', fragments[0]);
        } else  {
            this.transitionTo('projects.project.spider.sample', fragments[0], fragments[1]);
        }
    }
});
