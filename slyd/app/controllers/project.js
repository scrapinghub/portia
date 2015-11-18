import Ember from 'ember';
import BaseController from './base-controller';
import Spider from '../models/spider';
import utils from '../utils/utils';

export default BaseController.extend({
    fixedToolbox: true,
    breadCrumb: null,
    _breadCrumbs: function() {
        this.setBreadCrumb();
    }.observes('slyd.project'),

    setBreadCrumb: function() {
        var project_id = this.get('slyd.project');
        this.set('breadCrumb', this._project_name(project_id));
        this.set('breadCrumbModel', project_id);
    },

    additionalActions: function() {
        function makeCopyMessage(type, copied, renamed) {
            return copied.length + " " + type + (copied.length > 1 ? "s" : "") +
                " (" + copied.map(function(item) {
                    if (renamed[item]) {
                        return item + " as " + renamed[item];
                    }
                    return item;
                }).join(", ") + ")";
        }

        var copyAction = {
            modal: 'copy-spider',
            text: 'Copy Spider',
            title: 'Copy Spider to project',
            button_class: 'primary',
            button_text: 'Copy',
            okCallback: function() {
                if (!copyAction.params.spiders.length && !copyAction.params.items.length) {
                    return;
                }
                this.get('slyd').copySpider(
                    this.get('slyd.project'),
                    copyAction.params.destinationProject,
                    copyAction.params.spiders,
                    copyAction.params.items
                ).then(function(response) {
                    /*
                        Create a notification message like:
                            Successfully copied 2 spiders (spider1, spider2 as spider2_copy)
                            and 1 item (default as default_copy).
                    */
                    var copiedSpiders = response.copied_spiders;
                    var renamedSpiders = response.renamed_spiders;
                    var copiedItems = response.copied_items;
                    var renamedItems = response.renamed_items;
                    var messageParts = [];
                    if (copiedSpiders.length) {
                        messageParts.push(
                            makeCopyMessage("spider", copiedSpiders, renamedSpiders)
                        );
                    }
                    if (copiedItems.length) {
                        messageParts.push(
                            makeCopyMessage("item", copiedItems, renamedItems)
                        );
                    }
                    if (messageParts.length) {
                        this.showSuccessNotification(
                            "Successfully copied " +
                            messageParts.join(" and ") + "."
                        );
                    }
                }.bind(this));
            }.bind(this)
        };

        return [
            {
                component: 'file-download'
            },
            copyAction,
            {
                component: 'edit-items',
                controller: this
            },
            {
                text: 'Documentation',
                url: 'http://support.scrapinghub.com/list/24895-knowledge-base/?category=17201'
            }
        ];
    }.property(),

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
    isPublishing: false,

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

    noChanges: function() {
        return this.get('isPublishing') || this.get('isDeploying') || !this.get('hasChanges');
    }.property('hasChanges', 'isDeploying', 'isPublishing'),

    addSpider: function(siteUrl) {
        siteUrl = utils.cleanUrl(siteUrl);
        if (!siteUrl || this.get('addingNewSpider')) {
            return;
        }
        this.set('addingNewSpider', true);

        var documentView = this.get('documentView');
        documentView.showLoading();
        this.set('slyd.spider', null);
        this.set('ws.spider', null);
        this.get('ws')._sendPromise({
            _command: 'resolve',
            _meta: {id: utils.shortGuid()},
            url: siteUrl
        }).then(function(data) {
                if (data.error) {
                    documentView.hideLoading();
                    this.showErrorNotification('Failed to create spider', data.error);
                    return;
                }
                // XXX: Deal with incorrect model
                var names = this.get('model');
                if (!(names instanceof Array)) {
                    names = [];
                }
                var baseName = URI.parse(siteUrl).hostname.replace(/^www[0-9]?\./, '');
                var newSpiderName = this.getUnusedName(baseName, names);
                var spider = Spider.create(
                    { 'name': newSpiderName,
                      'start_urls': [siteUrl],
                      'follow_patterns': [],
                      'exclude_patterns': [],
                      'js_enabled': false,
                      'init_requests': [],
                      'templates': [],
                      'template_names': [],
                      'plugins': {}
                    });
                this.set('ws.spider', newSpiderName);
                this.get('ws').save('spider', spider).then(function() {
                        documentView.hideLoading();
                        this.set('slyd.spider', newSpiderName);
                        this.set('ws.spider', newSpiderName);
                        this.editSpider(newSpiderName, siteUrl);
                    }.bind(this), function(err) {
                        documentView.hideLoading();
                        this.set('ws.spider', this.get('slyd.spider'));
                        throw err;  // re-throw for the notification
                    }.bind(this)
                );
            }.bind(this), function(err) {
                documentView.hideLoading();
                throw err;  // re-throw for the notification
            })
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
                    this.set('ws.spider', spiderName);
                    this.get('ws').delete('spider', spiderName).then(
                        function() {
                            this.set('ws.spider', null);
                            this.get('model').removeObject(spiderName);
                            this.set('refreshSpiders', !this.get('refreshSpiders'));
                            this.get('changedFiles').addObject('spiders/' + spiderName + '.json');
                        }.bind(this)
                    );
                }.bind(this), null, 'danger', 'Yes, Delete'
            );
        },

        rename: function(newName, oldName) {
            this.get('slyd').renameProject(oldName, newName).then(
                function() {
                    this.set('slyd.project', newName);
                    this.set('ws.project', newName);
                    this.replaceRoute('project', newName);
                }.bind(this),
                function(err) {
                    this.set('slyd.project', oldName);
                    this.set('ws.project', oldName);
                    throw err;
                }.bind(this)
            );
        },

        publishProject: function() {
            this.set('isPublishing', true);
            this.publishProject().then(function(result) {
                this.set('isPublishing', false);
                if (result['status'] === 'ok') {
                    if (!Ember.isEmpty(result['schedule_url'])) {
                        this.showConfirm('Schedule Project',
                            this.messages.get('publish_ok_schedule'),
                            function() {
                                window.location = result['schedule_url'];
                            });
                    } else {
                        this.showSuccessNotification(this.messages.get('publish_ok'));
                    }
                    this.set('changedFiles', []);
                } else if (result['status'] === 'conflict') {
                    this.showWarningNotification(this.messages.get('publish_conflict'));
                    this.transitionToRoute('conflicts');
                } else {
                    this.showErrorNotification('Failed to publish project', result['message']);
                }
            }.bind(this), function(err) {
                this.set('isPublishing', false);
                throw err;
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
                        this.showSuccessNotification(this.messages.get('deploy_ok'));
                    }
                }
            }.bind(this), function(err) {
                this.set('isDeploying', false);
                throw err;
            }.bind(this));
        },

        discardChanges: function() {
            this.set('isPublishing', true);
            this.discardChanges().then(function(){
                this.set('isPublishing', false);
                this.transitionToRoute('projects');
            }.bind(this), function(err) {
                this.set('isPublishing', false);
                throw err;
            }.bind(this));
        },

        conflictedFiles: function() {
            this.transitionToRoute('conflicts');
        },
    },

    willEnter: function() {
        this.setBreadCrumb();
        this.get('documentView').reset();
        if (this.get('controllers.application.siteWizard')) {
            Ember.run.next(this, this.addSpider,
                           this.get('controllers.application.siteWizard'));
        }
    },
});
