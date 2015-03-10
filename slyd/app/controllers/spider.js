import Ember from 'ember';
import BaseController from './base-controller';
import { ElementSprite } from '../utils/canvas';
import SpriteStore from '../utils/sprite-store';
import ExtractedItem from '../models/extracted-item';
import Template from '../models/template';

/* global URI */

export default BaseController.extend({
    fixedToolbox: false,

    needs: ['application', 'projects', 'project', 'project/index'],

    saving: false,

    browseHistory: [],

    pageMap: {},

    loadedPageFp: null,

    autoloadTemplate: null,

    pendingFetches: [],

    itemDefinitions: null,

    extractedItems: [],

    testing: false,

    spriteStore: new SpriteStore(),

    startUrls: null,
    startUrlsAction: 'addStartUrls',
    editAllStartUrlsType: 'primary',
    editAllStartUrlsAction: 'editAllStartUrls',
    editAllStartUrlsText: 'Edit All',

    followPatternOptions: [
        { value: 'all', label: 'Follow all in-domain links' },
        { value: 'none', label: "Don't follow links" },
        { value: 'patterns', label: 'Configure follow and exclude patterns' }
    ],

    hasStartUrls: function() {
        return this.get('model.start_urls').length < 1 && this.get('editAllStartUrlsAction') === 'editAllStartUrls';
    }.property('model.start_urls.@each'),

    breadCrumb: function() {
        this.set('slyd.spider', this.get('model.name'));
        return this.get('model.name');
    }.property('model.name'),

    startUrlCount: function() {
        if (!Ember.isEmpty(this.get('model.start_urls'))) {
            return this.get('model.start_urls').length;
        } else {
            return 0;
        }
    }.property('model.start_urls.[]'),

    displayEditPatterns: function() {
        return this.get('links_to_follow') === 'patterns';
    }.property('links_to_follow'),

    displayNofollow: function() {
        return this.get('links_to_follow') !== 'none';
    }.property('links_to_follow'),

    _showLinks: false,

    showLinks: function(key, show) {
        if (arguments.length > 1) {
            if (show) {
                this.set('_showLinks', true);
                this.set('documentView.sprites', this.get('spriteStore'));
            } else {
                this.set('_showLinks', false);
                this.set('documentView.sprites', new SpriteStore());
            }
        }
        return this.get('_showLinks');
    }.property('_showLinks'),

    showItems: true,

    addTemplateDisabled: function() {
        return !this.get('loadedPageFp');
    }.property('loadedPageFp'),

    browseBackDisabled: function() {
        return this.get('browseHistory').length <= 1;
    }.property('browseHistory.@each'),

    reloadDisabled: function() {
        return !this.get('loadedPageFp');
    }.property('loadedPageFp'),

    showItemsDisabled: function() {
        var loadedPageFp = this.get('loadedPageFp');
        if (this.extractedItems.length > 0) {
            return false;
        }
        if (this.pageMap[loadedPageFp] && this.pageMap[loadedPageFp].items) {
            return !loadedPageFp ? true : !this.pageMap[loadedPageFp].items.length;
        }
        return true;
    }.property('loadedPageFp', 'extractedItems'),

    showNoItemsExtracted: function() {
        return this.get('loadedPageFp') && Ember.isEmpty(this.get('extractedItems')) && this.showItemsDisabled;
    }.property('loadedPageFp', 'showItemsDisabled'),

    itemsButtonLabel: function() {
        return this.get('showItems') ? "Hide Items " : "Show Items";
    }.property('showItems'),

    testButtonLabel: function() {
        if (this.get('testing')) {
            return "Stop testing";
        } else {
            return "Test spider";
        }
    }.property('testing'),

    links_to_follow: function(key, follow) {
        // The spider spec only supports 'patterns' or 'none' for the
        // 'links_to_follow' attribute; 'all' is only used for UI purposes.
        var model = this.get('model');
        var retVal = follow;
        if (arguments.length > 1) {
            if (follow !== 'patterns') {
                model.get('exclude_patterns').setObjects([]);
                model.get('follow_patterns').setObjects([]);
            }
            model.set('links_to_follow', follow === 'none' ? 'none' : 'patterns');
        } else {
            retVal = model.get('links_to_follow');
            if (retVal === 'patterns' &&
                Ember.isEmpty(model.get('follow_patterns')) &&
                Ember.isEmpty(model.get('exclude_patterns'))) {
                retVal = 'all';
            }
        }
        return retVal;
    }.property('model.links_to_follow',
               'model.follow_patterns',
               'model.exclude_patterns'),

    _get_init_request_property: function(prop) {
        if (this.get('model.init_requests').length > 0) {
            return this.get('model.init_requests')[0][prop];
        }
    },

    loginUrl: function() {
        return this._get_init_request_property('loginurl');
    }.property('model.init_requests'),

    loginUser: function() {
        return this._get_init_request_property('loginuser');
    }.property('model.init_requests'),

    loginPassword: function() {
        return this._get_init_request_property('loginpassword');
    }.property('model.init_requests'),

    spiderDomains: function() {
        var spiderDomains = new Set();
        this.get('model.start_urls').forEach(function(startUrl) {
            spiderDomains.add(URI.parse(startUrl)['hostname']);
        });
        return spiderDomains;
    }.property('model.start_urls.@each'),

    sprites: function() {
        if (!this.get('loadedPageFp') || !this.get('showLinks')) {
            return [];
        }
        var followedLinks = this.get('followedLinks'),
            allLinks = Ember.$(Ember.$('#scraped-doc-iframe').contents().get(0).links),
            sprites = [];
        allLinks.each(function(i, link) {
            var followed = followedLinks.indexOf(link.href) >= 0 &&
                this.get('spiderDomains').has(URI.parse(link.href)['hostname']);
            sprites.pushObject(ElementSprite.create({
                element: link,
                hasShadow: false,
                fillColor: followed ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)',
                strokeColor: followed ? 'rgba(0,255,0,0.3)' : 'rgba(255,0,0,0.3)' }));
        }.bind(this));
        this.set('spriteStore.sprites', sprites);
    }.observes('followedLinks', 'showLinks', 'spiderDomains'),

    currentUrl: function() {
        if (!Ember.isEmpty(this.get('pendingFetches'))) {
            return 'Fetching page...';
        } else if (this.get('loadedPageFp')) {
            return this.get('pageMap')[this.get('loadedPageFp')].url;
        } else {
            return 'No page loaded';
        }
    }.property('loadedPageFp', 'pendingFetches.@each'),

    editTemplate: function(templateName) {
        this.transitionToRoute('template', templateName);
    },

    viewTemplate: function(templateName) {
        this.get('slyd').loadTemplate(this.get('model.name'), templateName).then(function(template) {
            var newWindow = window.open('about:blank',
                '_blank',
                'resizable=yes, scrollbars=yes');
            newWindow.document.write(template.get('annotated_body'));
            newWindow.document.title = ('Template ' + template.get('name'));
        }, function(err) {this.showHTTPAlert('Error Getting Template', err);}.bind(this));
    },

    wrapItem: function(item) {
        var itemDefinition = this.get('itemDefinitions').findBy('name', item['_type']);
        return ExtractedItem.create({ extracted: item,
                                      definition: itemDefinition,
                                      matchedTemplate: item['_template_name'] });
    },

    updateExtractedItems: function(items) {
        var extractedItems = items.map(this.wrapItem, this);
        this.set('extractedItems', extractedItems);
    },

    fetchPage: function(url, parentFp, skipHistory) {
        this.set('loadedPageFp', null);
        var documentView = this.get('documentView');
        documentView.showLoading();
        var fetchId = this.guid();
        this.get('pendingFetches').pushObject(fetchId);
        this.set('documentView.sprites', new SpriteStore());
        this.get('slyd').fetchDocument(url, this.get('model.name'), parentFp).
            then(function(data) {
                if (this.get('pendingFetches').indexOf(fetchId) === -1) {
                    // This fetch has been cancelled.
                    return;
                }
                if (!data.error && data.response.status === 200) {
                    data.url = url;
                    if (!skipHistory) {
                        this.get('browseHistory').pushObject(data.fp);
                    }
                    documentView.displayDocument(data.page,
                        function(){
                            documentView.hideLoading();
                            this.get('pendingFetches').removeObject(fetchId);
                            this.get('documentView').reset();
                            this.get('documentView').config({ mode: 'browse',
                                              listener: this,
                                              dataSource: this });
                            this.set('documentView.sprites', this.get('spriteStore'));
                            this.set('loadedPageFp', data.fp);
                            this.set('followedLinks', data.links);
                            this.get('pageMap')[data.fp] = data;
                            this.updateExtractedItems(data.items || []);
                            Ember.run.later(function() {
                                this.get('documentView').redrawNow();
                            }.bind(this), 100);
                        }.bind(this)
                    );
                } else {
                    documentView.hideLoading();
                    this.get('pendingFetches').removeObject(fetchId);
                    documentView.showError(data.error || data.response.status);
                }
            }.bind(this), function(err) {this.showHTTPAlert('Fetch Error', err);}.bind(this)
        );
    },

    displayPage: function(fp) {
        this.set('loadedPageFp', null);
        var documentView = this.get('documentView');
        documentView.displayDocument(this.get('pageMap')[fp].page,
            function(){
                this.get('documentView').reset();
                this.get('documentView').config({ mode: 'browse',
                    listener: this,
                    dataSource: this });
                this.set('loadedPageFp', fp);
            }.bind(this));
    },

    addTemplate: function() {
        var page = this.get('pageMap')[this.get('loadedPageFp')];
        var template_name = this.shortGuid();
        var template = Template.create(
            { name: template_name,
              extractors: {},
              annotations: {},
              annotated_body: page.page,
              original_body: page.original,
              page_id: page.fp,
              _new: true,
              url: page.url }),
            itemDefs = this.get('itemDefinitions');
        if (!itemDefs.findBy('name', 'default') && !Ember.isEmpty(itemDefs)) {
            // The deault item doesn't exist but we have at least one item def.
            template.set('scrapes', itemDefs[0].get('name'));
        }
        this.get('model.template_names').pushObject(template_name);
        this.get('slyd').saveTemplate(this.get('name'), template).then(function() {
            this.saveSpider().then(
                function() {
                    this.editTemplate(template_name);
                }.bind(this), function(err) {
                    this.showHTTPAlert('Save Error', err);
                }.bind(this));
            }.bind(this), function(err) {
                this.showHTTPAlert('Save Error', err);
            }.bind(this)
        );
    },

    addStartUrls: function(urls) {
        if (typeof(urls) === 'string') {
            urls = urls.match(/[^\s,]+/g);
        }
        var modelUrls = this.get('model.start_urls');
        urls.forEach(function(url) {
            var parsed = URI.parse(url);
            if (Ember.$.inArray(url, modelUrls) > 0) {
                return;
            }
            if (!parsed.protocol) {
                parsed.protocol = 'http';
                url = URI.build(parsed);
            }
            modelUrls.pushObject(url);
        }.bind(this));
    },

    addExcludePattern: function(pattern, index) {
        if (index !== undefined) {
            this.get('model.exclude_patterns').insertAt(index, pattern);
            this.notifyPropertyChange('links_to_follow');
        } else {
            this.get('model.exclude_patterns').pushObject(pattern);
        }
    },

    deleteExcludePattern: function(pattern) {
        this.get('model.exclude_patterns').removeObject(pattern);
    },

    addFollowPattern: function(pattern, index) {
        if (index !== undefined) {
            this.get('model.follow_patterns').insertAt(index, pattern);
            this.notifyPropertyChange('links_to_follow');
        } else {
            this.get('model.follow_patterns').pushObject(pattern);
        }
    },

    deleteFollowPattern: function(pattern) {
        this.get('model.follow_patterns').removeObject(pattern);
    },

    autoFetch: function() {
        if (this.get('loadedPageFp') && this.get('showLinks')) {
            this.saveSpider().then(function() {
                this.fetchPage(this.get('pageMap')[this.get('loadedPageFp')].url, null, true);
            }.bind(this));
        }
    }.observes('model.follow_patterns.@each',
               'model.exclude_patterns.@each',
               'links_to_follow'),

    attachAutoSave: function() {
        this.get('model').addObserver('dirty', function() {
            Ember.run.once(this, 'saveSpider');
        }.bind(this));
    }.observes('model'),

    saveSpider: function() {
        this.set('saving', true);
        return this.get('slyd').saveSpider(this.get('content')).then(function() {
            this.set('saving', false);
        }.bind(this),function(err) {
            this.set('saving', false);
            this.showHTTPAlert('Save Error', err);
        }.bind(this));
    },

    reset: function() {
        this.set('browseHistory', []);
        this.set('pageMap', {});
    }.observes('content'),

    testSpider: function(urls) {
        if (this.get('testing') && urls.length) {
            var fetchId = this.guid();
            this.get('pendingFetches').pushObject(fetchId);
            this.get('slyd').fetchDocument(urls[0], this.get('model.name')).then(
                function(data) {
                    if (this.get('pendingFetches').indexOf(fetchId) !== -1) {
                        this.get('pendingFetches').removeObject(fetchId);
                        if (!Ember.isEmpty(data.items)) {
                            data.items.forEach(function(item) {
                                this.get('extractedItems').pushObject(this.wrapItem(item));
                            }, this);
                        }
                        this.testSpider(urls.splice(1));
                    } else {
                        this.set('testing', false);
                    }
                }.bind(this),
                function(err) {
                    this.showHTTPAlert('Fetch Error', err);
                }.bind(this)
            );
        } else {
            this.get('documentView').hideLoading();
            if (Ember.isEmpty(this.get('extractedItems'))) {
                this.showAlert('Test Completed', this.messages.get('no_items_extracted'));
            }
            this.set('testing', false);
        }
    },

    actions: {

        editAllStartUrls: function() {
            this.set('startUrlsAction', 'updateAllStartUrls');
            this.set('startUrls', this.get('model.start_urls').join('\n\n'));
            this.set('model.start_urls', []);
            this.set('editAllStartUrlsType', 'danger');
            this.set('editAllStartUrlsAction', 'cancelEditAllSpiders');
            this.set('editAllStartUrlsText', 'cancel');
        },

        updateAllStartUrls: function(urls) {
            this.set('editAllStartUrlsType', 'primary');
            this.set('editAllStartUrlsAction', 'editAllStartUrls');
            this.set('editAllStartUrlsText', 'Edit All');
            this.set('startUrlsAction', 'addStartUrls');
            this.set('startUrls', null);
            this.addStartUrls(urls);
        },

        cancelEditAllSpiders: function() {
            this.set('editAllStartUrlsType', 'primary');
            this.set('editAllStartUrlsAction', 'editAllStartUrls');
            this.set('editAllStartUrlsText', 'Edit All');
            this.addStartUrls(this.get('startUrls'));
            this.set('startUrls', null);
        },

        editTemplate: function(templateName) {
            this.editTemplate(templateName);
        },

        addTemplate: function() {
            this.addTemplate();
        },

        deleteTemplate: function(templateName) {
            this.get('model.template_names').removeObject(templateName);
            this.get('slyd').deleteTemplate(this.get('name'), templateName).then(
                function() { }, function(err) {
                    this.showHTTPAlert('Delete Error', err);
                }.bind(this));
        },

        viewTemplate: function(templateName) {
            this.viewTemplate(templateName);
        },

        fetchPage: function(url) {
            // Cancel all pending fetches.
            this.get('pendingFetches').setObjects([]);
            this.fetchPage(url);
        },

        reload: function() {
            this.fetchPage(this.get('pageMap')[this.get('loadedPageFp')].url, null, true);
        },

        browseBack: function() {
            var history = this.get('browseHistory');
            history.removeAt(history.length - 1);
            var lastPageFp = history.get('lastObject');
            this.displayPage(lastPageFp);
        },

        addStartUrls: function(urls) {
            this.addStartUrls(urls);
        },

        deleteStartUrl: function(url) {
            this.get('model.start_urls').removeObject(url);
        },

        addExcludePattern: function(text) {
            if (text) {
                this.addExcludePattern(text);
            }
        },

        deleteExcludePattern: function(pattern) {
            this.deleteExcludePattern(pattern);
        },

        editExcludePattern: function(newVal, index) {
            this.deleteExcludePattern(this.get('model.exclude_patterns').objectAt(index));
            this.addExcludePattern(newVal, index);
        },

        addFollowPattern: function(text) {
            if (text) {
                this.addFollowPattern(text);
            }
        },

        deleteFollowPattern: function(pattern) {
            this.deleteFollowPattern(pattern);
        },

        editFollowPattern: function(newVal, index) {
            this.deleteFollowPattern(this.get('model.follow_patterns').objectAt(index));
            this.addFollowPattern(newVal, index);
        },

        toggleShowItems: function() {
            this.set('showItems', !this.get('showItems'));
        },

        rename: function(newName, oldName) {
            var spidersForProject = this.get('controllers.project.model') || [];
            newName = this.getUnusedName(newName, spidersForProject);
            this.set('model.name', newName);
            this.get('slyd').renameSpider(oldName, newName).then(
                function() {
                    this.set('spiderName', newName);
                    this.replaceRoute('spider', newName);
                }.bind(this),
                function(reason) {
                    this.set('model.name', this.get('spiderName'));
                    this.showHTTPAlert('Save Error', reason);
                }.bind(this)
            );
        },

        testSpider: function() {
            if (this.get('testing')) {
                this.set('testing', false);
            } else {
                this.set('testing', true);
                this.get('documentView').showLoading();
                this.get('pendingFetches').setObjects([]);
                this.get('extractedItems').setObjects([]);
                this.set('showItems', true);
                this.testSpider(this.get('model.start_urls').copy());
            }
        },

        updateLoginInfo: function() {
            Ember.run.once(this, 'saveSpider');
        },

        addInitRequest: function(value, field) {
            if (field) {
                this.set(field, value);
                if (this.get('loginUrl') && this.get('loginUser') && this.get('loginPassword')) {
                    this.set('model.init_requests', [{
                        "type": "login",
                        "loginurl": this.get('loginUrl'),
                        "username": this.get('loginUser'),
                        "password": this.get('loginPassword')
                    }]);
                }
            }
        }
    },

    documentActions: {

        linkClicked: function(url) {
            this.get('documentView').showLoading();
            this.fetchPage(url, this.get('loadedPageFp'));
        }
    },

    willEnter: function() {
        this.set('loadedPageFp', null);
        this.get('extractedItems').setObjects([]);
        this.get('documentView').config({ mode: 'browse',
                                          listener: this,
                                          dataSource: this });
        this.get('documentView').showSpider();
        var newSpiderSite = this.get('controllers.application.siteWizard');
        if (newSpiderSite) {
            Ember.run.next(this, function() {
                this.addStartUrls(newSpiderSite);
                this.fetchPage(this.get('model.start_urls')[0]);
                this.set('controllers.application.siteWizard', null);
                Ember.run.once(this, 'saveSpider');
            });
        }
        if (this.get('autoloadTemplate')) {
            Ember.run.next(this, function() {
                this.saveSpider().then(function() {
                    this.fetchPage(this.get('autoloadTemplate'), null, true);
                    this.set('autoloadTemplate', null);
                }.bind(this));
            });
        }
        this.set('spiderName', this.get('model.name'));
        this.set('documentView.sprites', new SpriteStore());
    },

    willLeave: function() {
        this.set('documentView.sprites', new SpriteStore());
        this.get('documentView').redrawNow();
        this.get('pendingFetches').setObjects([]);
        this.get('documentView').hideLoading();
    },
});
