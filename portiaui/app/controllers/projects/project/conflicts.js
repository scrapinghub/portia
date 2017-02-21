import Ember from 'ember';

export default Ember.Controller.extend({
    projectController: Ember.inject.controller('projects.project'),
    currentFileName: null,

    conflictedKeyPaths: {},

    conflictedFiles: Ember.computed('model', function() {
        return Object.keys(this.get('model')).sort().map((name) => ({
            name: name,
            encodedName: btoa(name),
        }));
    }),
});
