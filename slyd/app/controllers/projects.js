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
        }.bind(this), function(err) {
            this.showHTTPAlert('Error Opening project "' + projectName + '"', err);
        }.bind(this));
    },

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
                            this.get('model').removeObject(projectName);
                        }.bind(this),
                        function(err) {
                            this.showHTTPAlert('Delete Error', err);
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
                        this.get('model').pushObject(newProjectName);
                        this.transitionToRoute('project', { id: newProjectName });
                    }.bind(this), function(err) {this.showHTTPAlert('Save Error', err);}.bind(this));
                }.bind(this), function(err) {this.showHTTPAlert('Save Error', err);}.bind(this));
            }.bind(this), function(err) {this.showHTTPAlert('Save Error', err);}.bind(this));
        },

        showProjectRevisions: function(projectName) {
            this.get('slyd').projectRevisions(projectName).then(function(revisions) {
                this.get('projectRevisions')[projectName] = revisions['revisions'];
                this.notifyPropertyChange('projectRevisions');
            }.bind(this), function(err) {
                this.showHTTPAlert('Error Getting Projects', err);
            }.bind(this));
        },

        hideProjectRevisions: function(projectName) {
            delete this.get('projectRevisions')[projectName];
            this.notifyPropertyChange('projectRevisions');
        },
    },

    willEnter: function() {
        this.get('documentView').reset();
        this.get('documentView').showSpider();
    },
});
