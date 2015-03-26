import Ember from 'ember';
import BaseController from './base-controller';
import Spider from '../models/spider';

/* global URI */

export default BaseController.extend({
    fixedToolbox: true,
    breadCrumbs: function() {
        var project_id = this.get('slyd.project');
        return [{
            label: this._project_name(project_id),
            model: project_id
        }];
    }.property('slyd.project'),

    needs: ['application', 'project'],

    spiderPage: null,

    _project_name: function(project_id) {
        return this.get('project_models.projects.' + project_id) || project_id;
    },

    project_name: function() {
        return this._project_name(this.get('slyd.project'));
    }.property('slyd.project'),

    changedFiles: [],

    isDeploying: false,

    filteredSpiders: function() {
        var a = Ember.A(),
            filterText = this.filterSpider || '',
            re = new RegExp(filterText.replace(/[^A-Z0-9_-]*/gi, ''), 'i');
        for (var i=0; i < this.get('model').length; i++) {
            var m = this.model[i];
            if (re.test(m)) {
                a.push(m);
            }
        }
        return a;
    }.property('filterSpider', 'model', 'refreshSpiders'),

    hasChanges: function() {
        return !Ember.isEmpty(this.get('changedFiles'));
    }.property('changedFiles.[]'),

    addSpider: function(siteUrl) {
        if (this.get('addingNewSpider')) {
            return;
        }
        this.set('addingNewSpider', true);
        if (siteUrl.indexOf('http') !== 0) {
            siteUrl = 'http://' + siteUrl;
        }
        this.get('slyd').fetchDocument(siteUrl)
            .then(function(data) {
                if (data.error) {
                    var title = "Spider wasn't created";
                    var content = "Server responded with error: <br><br>" + data.error;
                    this.showAlert(title, content);
                    return;
                }
                // XXX: Deal with incorrect model
                var names = this.get('model');
                if (names instanceof Object) {
                    names = [];
                }
                var newSpiderName = this.getUnusedName(URI.parse(siteUrl).hostname, names);
                var spider = Spider.create(
                    { 'id': this.shortGuid(),
                      'name': newSpiderName,
                      'start_urls': [siteUrl],
                      'follow_patterns': [],
                      'exclude_patterns': [],
                      'init_requests': [],
                      'templates': [],
                      'template_names': [],
                      'plugins': {}
                    });
                this.get('slyd').saveSpider(spider).then(function() {
                        this.editSpider(newSpiderName, siteUrl);
                    }.bind(this), function(err) {
                        this.showHTTPAlert('Error Adding Spider', err);
                    }.bind(this)
                );

            }.bind(this))
            .finally(function() {
                this.set('controllers.application.siteWizard', null);
                this.set('spiderPage', null);
                this.set('addingNewSpider', false);
            }.bind(this));
    },

    editSpider: function(spiderName, siteUrl) {
        this.get('slyd').loadSpider(spiderName).then(function(spider) {
            var query = {};
            if (siteUrl) {
                query['queryParams'] = {url: siteUrl};
                this.transitionToRoute('spider', spider, query);
            } else {
                this.transitionToRoute('spider', spider);
            }
        }.bind(this), function(err) {
            this.showHTTPAlert('Error Editing Spider', err);
        }.bind(this));
    },

    publishProject: function() {
        return this.get('slyd').publishProject(this.get('slyd.project'));
    },

    discardChanges: function() {
        return this.get('slyd').discardChanges(this.get('slyd.project'));
    },

    deployProject: function() {
        return this.get('slyd').deployProject(this.get('slyd.project'));
    },

    actions: {

        editSpider: function(spiderName) {
            this.editSpider(spiderName);
        },

        addSpider: function(siteUrl) {
            this.addSpider(siteUrl);
        },

        deleteSpider: function(spider) {
            var spiderName = spider;
            this.showConfirm('Delete ' + spiderName,
                'Are you sure you want to delete spider ' + spiderName + '?',
                function() {
                    this.get('slyd').deleteSpider(spiderName).then(
                        function() {
                            this.get('model').removeObject(spiderName);
                            this.set('refreshSpiders', !this.get('refreshSpiders'));
                            this.get('changedFiles').addObject('spiders/' + spiderName + '.json');
                        }.bind(this),
                        function(err) {
                            this.showHTTPAlert('Delete Error', err);
                        }.bind(this)
                    );
                }.bind(this),
                function() {},
                'danger',
                'Yes, Delete'
            ).bind(this);
        },

        rename: function(newName, oldName) {
            this.get('slyd').renameProject(oldName, newName).then(
                function() {
                    this.set('slyd.project', newName);
                    this.replaceRoute('project', newName);
                }.bind(this),
                function() {
                    this.set('slyd.project', oldName);
                    this.showAlert('Save Error','The name ' + newName + ' is not a valid project name.');
                }.bind(this)
            );
        },

        publishProject: function() {
            this.publishProject().then(function(result) {
                if (result['status'] === 'ok') {
                    if (!Ember.isEmpty(result['schedule_url'])) {
                        this.showConfirm('Schedule Project',
                            this.messages.get('publish_ok_schedule'),
                            function() {
                                window.location = result['schedule_url'];
                            });
                    } else {
                        this.showAlert('Publish Successful', this.messages.get('publish_ok'));
                    }
                    this.set('changedFiles', []);
                } else if (result['status'] === 'conflict') {
                    this.showAlert('Publish Error', this.messages.get('publish_conflict'));
                    this.transitionToRoute('conflicts');
                } else {
                    this.showAlert('Publish Error', result['message']);
                }
            }.bind(this));
        },

        deployProject: function() {
            this.set('isDeploying', true);
            this.deployProject().then(function(result) {
                this.set('isDeploying', false);
                if (result['status'] === 'ok') {
                    if (!Ember.isEmpty(result['schedule_url'])) {
                        this.showConfirm('Schedule Project',
                            this.messages.get('deploy_ok_schedule'),
                            function() {
                                window.location = result['schedule_url'];
                            });
                    } else {
                        this.showAlert('Save Successful', this.messages.get('deploy_ok'));
                    }
                }
            }.bind(this), function(err) {
                this.set('isDeploying', false);
                this.showHTTPAlert('Deploy Error', err);
            }.bind(this));
        },

        discardChanges: function() {
            this.discardChanges().then(function(){
                this.transitionToRoute('projects');
            }.bind(this), function(err) {
                this.showHTTPAlert('Revert Error', err);
            }.bind(this));
        },

        conflictedFiles: function() {
            this.transitionToRoute('conflicts');
        },
    },

    willEnter: function() {
        this.get('documentView').reset();
        this.get('documentView').showSpider();
        if (this.get('controllers.application.siteWizard')) {
            Ember.run.next(this, this.addSpider,
                           this.get('controllers.application.siteWizard'));
        }
    },
});
