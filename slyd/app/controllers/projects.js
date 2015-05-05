import Ember from 'ember';
import BaseController from './base-controller';
import Item from '../models/item';

export default BaseController.extend({
    fixedToolbox: true,
    breadCrumb: 'home',
    needs: ['application'],
    projectSite: null,

    projectRevisions: {},

    revisionsForProject: function(projectName) {
        if (projectName in this.get('projectRevisions')) {
            return this.get('projectRevisions')[projectName];
        } else {
            return [];
        }
    },

    openProject: function(projectName, revision) {
        this.get('slyd').editProject(projectName, revision).then(function() {
            this.set('slyd.project', projectName);
            this.transitionToRoute('project', { id: projectName });
        }.bind(this));
    },

    displayProjects: function() {
        return (this.get('model') || []).map(function(p) {
            if (p instanceof Object) {
                return p;
            }
            return { id: p, name: p };
        });
    }.property('model', 'model.@each'),

    actions: {

        openProject: function(projectName) {
            this.openProject(projectName, 'master');
        },

        openProjectRevision: function(projectName, revision) {
            this.openProject(projectName, revision);
        },

        deleteProject: function(projectName) {
            this.showConfirm('Delete ' + projectName,
                'Are you sure you want to delete this project? This operation cannot be undone.',
                function() {
                    this.get('slyd').deleteProject(projectName).then(
                        function() {
                            this.set('model', this.get('model').filter(function(p) {
                                if (p instanceof Object) {
                                    if (p.id !== projectName) {
                                        return p;
                                    }
                                } else {
                                    if (p !== projectName) {
                                        return p;
                                    }
                                }
                            }));
                        }.bind(this)
                    );
                }.bind(this),
                function() {},
                'danger',
                'Yes, Delete'
            );
        },

        createProject: function(projectSite) {
            var newProjectName = this.getUnusedName('new_project', this.get('model'));
            this.get('slyd').createProject(newProjectName).then(function() {
                this.get('slyd').editProject(newProjectName).then(function() {
                    this.set('slyd.project', newProjectName);
                    // Initialize items spec.
                    var itemsPromise = this.get('slyd').saveItems([
                        Item.create({ name: 'default', fields: [ ]
                        })
                    ]);
                    // Initialize extractors spec.
                    var extractorsPromise = this.get('slyd').saveExtractors([]);
                    // Setup automatic creation of an initial spider.
                    this.set('controllers.application.siteWizard', projectSite);
                    Ember.RSVP.all([itemsPromise, extractorsPromise]).then(function() {
                        this.get('model').pushObject({id: newProjectName, name: newProjectName});
                        this.transitionToRoute('project', { id: newProjectName });
                    }.bind(this));
                }.bind(this));
            }.bind(this));
        },

        showProjectRevisions: function(projectName) {
            this.get('slyd').projectRevisions(projectName).then(function(revisions) {
                this.get('projectRevisions')[projectName] = revisions['revisions'];
                this.notifyPropertyChange('projectRevisions');
            }.bind(this));
        },

        hideProjectRevisions: function(projectName) {
            delete this.get('projectRevisions')[projectName];
            this.notifyPropertyChange('projectRevisions');
        },
    },

    willEnter: function() {
        this.set('breadCrumb', 'home');
        if (this.get('controllers.application.currentRouteName').split('.')[1] === 'index') {
            this.set('slyd.project', null);
        }
        this.get('documentView').reset();
        this.get('documentView').showSpider();
    },
});
