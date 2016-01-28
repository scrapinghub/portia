import Ember from 'ember';

export default Ember.Controller.extend({
    currentFileName: null,

    conflictedKeyPaths: {},

    conflictedFiles: Ember.computed('model', function() {
        return Object.keys(this.get('model')).sort().map((name) => ({
            name: name,
            encodedName: btoa(name),
        }));
    }),

    actions: {
        saveFile: function(fileName) {
            this.get('slyd').saveFile(
                this.get('slyd.project'),
                fileName,
                this.resolveContent(this.get('model')[fileName])).then(() => {
                    //delete this.get('model')[fileName];
                    //this.notifyPropertyChange('model');
                    if (Ember.isEmpty(this.get('conflictedFileNames'))) {
                        //this.get('slyd').publishProject(this.get('slyd.project'), true);
                        //this.showSuccessNotification(this.messages.get('conflicts_solved'));
                        //this.transitionToRoute('projects');
                    } else {
                        //this.displayConflictedFile(this.get('conflictedFileNames')[0]);
                    }
                });
        },

        publish: function() {
            //this.get('slyd').publishProject(this.get('slyd.project'), true);
        },
    },

});
