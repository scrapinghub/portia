import Ember from 'ember';

export default Ember.Route.extend({
    model() {
        return $.post('/projects', JSON.stringify({
            cmd: 'conflicts',
            args: [this.modelFor("projects.project").id]
        }));
    },

    renderTemplate() {
        this.render('projects/project/conflicts/file-selector', {
            into: 'application',
            outlet: 'side-bar',
        });

        this.render('projects/project/conflicts/help', {
            into: 'application',
            outlet: 'main',
        });
    },
});
