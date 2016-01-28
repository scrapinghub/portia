import Ember from 'ember';

export default Ember.Route.extend({
    model(params) {
        var allConflicts = this.modelFor("projects.project.conflicts");
        var file = atob(params.file_path);
        return {
            file: file,
            contents: allConflicts[file],
        };
    },

    renderTemplate() {
        this.render('projects/project/conflicts/topbar', {
            into: 'application',
            outlet: 'top-bar',
        });

        this.render('projects/project/conflicts/resolver', {
            into: 'application',
            outlet: 'main',
        });
    },
});
