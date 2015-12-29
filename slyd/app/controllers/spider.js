import Ember from 'ember';
import BaseController from './base-controller';
import { ElementSprite } from '../utils/canvas';
import SpriteStore from '../utils/sprite-store';
import ExtractedItem from '../models/extracted-item';
import Template from '../models/template';
import utils from '../utils/utils';

export default BaseController.extend({
    fixedToolbox: false,

    needs: ['application', 'projects', 'project', 'project/index'],

    queryParams: ['url', 'baseurl'],
    url: null,
    baseurl: null,

    saving: false,

    browseHistory: [], // List of urls
    pendingUrls: [], // List of urls we still need to fetch when testing spider

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
        return this.get('startUrlCount') < 1 && this.get('editAllStartUrlsAction') === 'editAllStartUrls';
    }.property('model.start_urls.@each'),

    _breadCrumb: function() {
        this.set('slyd.spider', this.get('model.name'));
        this.set('ws.spider', this.get('model.name'));
        this.set('breadCrumb', this.get('model.name'));
    }.observes('model.name'),

    startUrlCount: function() {
        return this.get('model.start_urls').length;
    }.property('model.start_urls.[]'),

    displayEditPatterns: Ember.computed.equal('links_to_follow', 'patterns'),

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
    isFetching: Ember.computed.reads('documentView.loading'),
    currentUrl: Ember.computed.reads('documentView.currentUrl'),
    noPageLoaded: Ember.computed.not('currentUrl'),
    addTemplateDisabled: Ember.computed.or('noPageLoaded', 'ws.closed', 'isFetching', 'testing'),
    reloadDisabled: Ember.computed.or('noPageLoaded', 'ws.closed', 'isFetching'),
    haveItems: Ember.computed.notEmpty('extractedItems'),
    pageActionsEnabled: Ember.computed.reads('model.js_enabled'),

    browseBackDisabled: function() {
        return this.get('ws.closed') || this.get('browseHistory').length <= 1;
    }.property('browseHistory.@each', 'ws.closed'),

    showNoItemsExtracted: function(){
        return this.get('currentUrl') && !this.get('isFetching') && !this.get('haveItems');
    }.property('haveItems', 'isFetching'),

    urlLabel: function() {
        return this.get('currentUrl') || 'No page loaded';
    }.property('currentUrl', 'isFetching'),


    itemsButtonLabel: function() {
        return this.get('showItems') ? "Hide Items " : "Show Items";
    }.property('showItems'),

    testButtonLabel: function() {
        return this.get('testing') ? "Stop testing" : "Test spider";
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
        return this._get_init_request_property('username');
    }.property('model.init_requests'),

    loginPassword: function() {
        return this._get_init_request_property('password');
    }.property('model.init_requests'),

    spiderDomains: function() {
        var spiderDomains = new Set();
        this.get('model.start_urls').forEach(function(startUrl) {
            spiderDomains.add(URI.parse(startUrl)['hostname']);
        });
        return spiderDomains;
    }.property('model.start_urls.@each'),

    _updateSprites: function() {
        if (!this.get('currentUrl') || !this.get('showLinks')) {
            return [];
        }
        var followedLinks = this.getWithDefault('followedLinks', {}),
            allLinks = Ember.$(Ember.$('#scraped-doc-iframe').contents().get(0).links),
            sprites = [],
            colors = {
                'raw': 'rgba(45,136,45,0.3)',
                'js': 'rgba(34,102,102,0.3)'
            };
        allLinks.each(function(i, link) {
            var uri = URI(link.href),
                followed = followedLinks[uri.fragment('').toString()] &&
                           this._allowedDomain(uri.hostname());
            sprites.pushObject(ElementSprite.create({
                element: link,
                hasShadow: false,
                fillColor: followed ? colors[followedLinks[link.href]] : 'rgba(255,57,57,0.3)',
                strokeColor: 'rgba(164,164,164,0.1)' }));
        }.bind(this));
        this.set('spriteStore.sprites', sprites);
    }.observes('followedLinks', 'showLinks', 'spiderDomains'),

    _allowedDomain: function(hostname) {
        var split_host = hostname.split('.');
        for (var i=0; i < split_host.length; i++) {
            if (this.get('spiderDomains').has(split_host.slice(-i-2).join('.'))) {
                return true;
            }
        }
        return false;
    },

    editTemplate: function(templateName) {
        this.transitionToRoute('template', templateName);
    },

    viewTemplate: function(templateName) {
        this.get('slyd').loadTemplate(this.get('model.name'), templateName).then(function(template) {
            var newWindow = window.open('about:blank',
                '_blank',
                'resizable=yes, scrollbars=yes');
            if (newWindow) {
                newWindow.document.write(template.get('annotated_body'));
                newWindow.document.title = ('Sample ' + template.get('name'));
            } else {
                this.showWarningNotification(
                    'Could not open a new browser window. ' +
                    'Please check your browser\'s pop-up settings.'
                );
            }
        }.bind(this));
    },

    wrapItem: function(item) {
        var itemDefinition = (this.get('project_models.items') || this.get('itemDefinitions')).findBy('name', item['_type']);
        return ExtractedItem.create({ extracted: item,
                                      definition: itemDefinition,
                                      matchedTemplate: item['_template_name'] });
    },

    loadUrl: function(url, baseUrl) {
        this.get('documentView').loadUrl(url, this.get('model.name'), baseUrl);
    },

    addTemplate: function() {
        let iframeTitle = (this.get('documentView').getIframe()[0].title
            .trim()
            .replace(/[^a-z\s_-]/ig, '')
            .replace(/\s+/g, '_')
            .substring(0, 48)
            .replace(/_+$/, '') || utils.shortGuid());

        // Find an unique template name
        let template_name = iframeTitle;
        let template_num = 1;
        while(this.get('model.template_names').contains(template_name)) {
            template_name = iframeTitle + '_' + (template_num++);
        }

        var template = Template.create({
            name: template_name,
            extractors: {},
            annotations: {},
            page_id: this.get('documentView.currentFp'),
            _new: true,
            url: this.get('currentUrl')
        });
        var itemDefs = this.get('itemDefinitions');

        if (!itemDefs.findBy('name', 'default') && !Ember.isEmpty(itemDefs)) {
            // The default item doesn't exist but we have at least one item def.
            template.set('scrapes', itemDefs[0].get('name'));
        } else {
            template.set('scrapes', 'default');
        }
        this.get('model.template_names').pushObject(template_name);
        var serialized = template.serialize();
        serialized._new = true;
        this.get('ws').save('template', serialized)
            .then((data) => {
                let mutations = this.get('documentView.mutationsAfterLoaded');
                if(!data.saved.template._uses_js && mutations > 1) {
                    this.showWarningNotification('JavaScript is disabled', this.get('messages.template_js_disabled'));
                }
            })
            .then(() => this.saveSpider(true))
            .then(() => {
                this.editTemplate(template_name);
            });
    },

    addStartUrls: function(urls) {
        if (typeof(urls) === 'string') {
            urls = urls.match(/[^\s,]+/g);
        }
        var modelUrls = this.get('model.start_urls');
        urls.forEach((url) => {
            url = utils.cleanUrl(url);
            if (url && Ember.$.inArray(url, modelUrls) < 0) {
                modelUrls.pushObject(url);
            }
        });
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

    attachAutoSave: function() {
        this.get('model').addObserver('dirty', function() {
            Ember.run.once(this, 'saveSpider');
        }.bind(this));
    }.observes('model'),

    saveSpider: function(force=false) {
        if (!force && this.get('saving')) {
            return;
        }
        this.set('saving', true);
        return this.get('ws').save('spider', this.get('model')).finally(() => {
            if(!this.isDestroying) {
                this.set('saving', false);
            }
        });
    },

    testSpider: function() {
        let urls = this.get('pendingUrls');

        let addItems = (data) => {
            let items = (data.items || []).map(this.wrapItem, this);
            this.get('extractedItems').pushObjects(items);
        };

        let fetchNext = () => {
            if(urls.length) {
                return this.get('slyd').fetchDocument(urls.pop(), this.get('model.name'))
                    .then(addItems, utils.showErrorNotification)
                    .then(fetchNext);
            } else {
                return new Ember.RSVP.Promise((resolve) => resolve('done'));
            }
        };

        fetchNext().then(() => {
            this.get('documentView').hideLoading();
            this.set('testing', false);
        });
    },

    reload: function() {
        // TODO: This resets the baseurl the page was loaded with (if it was set)
        this.loadUrl(this.get('documentView.currentUrl'));
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
            this.get('ws').delete('template', templateName);
        },

        viewTemplate: function(templateName) {
            this.viewTemplate(templateName);
        },

        loadUrl: function(url) {
            this.loadUrl(url);
        },

        reload: function() {
            this.reload();
        },

        browseBack: function() {
            var history = this.get('browseHistory');
            history.popObject();
            var lastPageUrl = history.get('lastObject');
            // TODO: This resets the baseurl the page was loaded with (if it was set)
            this.loadUrl(lastPageUrl);
        },

        navigate: function(url) {
            url = utils.cleanUrl(url);
            if(url) {
                this.loadUrl(url);
            }
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

        addJSEnablePattern: function(text) {
            this.addJSPattern(text, 'enable');
        },

        editJSEnablePattern: function(newVal, index) {
            this.editJSPattern(newVal, index, 'enable');
        },

        deleteJSEnablePattern: function(text) {
            this.deleteJSPattern(text, 'enable');
        },

        addJSDisablePattern: function(text) {
            this.addJSPattern(text, 'disable');
        },

        editJSDisablePattern: function(newVal, index) {
            this.editJSPattern(newVal, index, 'disable');
        },

        deleteJSDisablePattern: function(text) {
            this.deleteJSPattern(text, 'disable');
        },

        toggleShowItems: function() {
            this.set('showItems', !this.get('showItems'));
        },

        rename: function(newName) {
            var oldName = this.get('model.name');
            if (newName.trim() === oldName.trim()) {
                return;
            }
            this.set('model.name', newName);
            this.get('ws').rename('spider', oldName, newName).then(
                function() {
                    this.replaceRoute('spider', newName);
                }.bind(this),
                function(err) {
                    this.set('model.name', oldName);
                    this.showErrorNotification(err.toString());
                }.bind(this)
            );
        },

        testSpider: function() {
            if (this.get('testing')) {
                this.get('pendingUrls').clear();
            } else {
                this.set('testing', true);
                this.get('documentView').showLoading();
                this.get('extractedItems').clear();
                this.set('showItems', true);
                this.get('pendingUrls').setObjects(this.get('model.start_urls').copy());
                this.testSpider();
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
                        "loginurl": utils.cleanUrl(this.get('loginUrl')),
                        "username": this.get('loginUser'),
                        "password": this.get('loginPassword')
                    }]);
                }
            }
        },

        toggleRecording: function() {
            this.get('documentView').toggleProperty('recording');
        }
    },

    documentActions: {
        pageMetadata: function(data) {
            if(!this.get('testing')) {
                this.set('extractedItems', (data.items || []).map(this.wrapItem, this));
            }
            this.set('followedLinks', data.links || []);

            if (this.get('browseHistory.lastObject') !== data.url){
                this.get('browseHistory').pushObject(data.url);
            }
        }
    },

    addJSPattern: function(text, type) {
        if (!this.get('model.js_'+type+'_patterns')) {
            this.set('model.js_'+type+'_patterns', [text]);
        } else {
            this.get('model.js_'+type+'_patterns').pushObject(text);
        }
        this.notifyPropertyChange('model.js_'+type+'_patterns');
        this.notifyPropertyChange('links_to_follow');
    },

    editJSPattern: function(val, index, type) {
        this.deleteJSPattern(this.get('model.js_'+type+'_patterns').objectAt(index), type);
        this.get('model.js_'+type+'_patterns').insertAt(index, val);
        this.notifyPropertyChange('model.js_'+type+'_patterns');
        this.notifyPropertyChange('links_to_follow');
    },

    deleteJSPattern: function(text, type) {
        this.get('model.js_'+type+'_patterns').removeObject(text);
        this.notifyPropertyChange('model.js_'+type+'_patterns');
        this.notifyPropertyChange('links_to_follow');
    },

    _willEnter: function() { // willEnter spider.index controller
        this.get('extractedItems').setObjects([]);
        this.get('documentView').config({
            mode: 'browse',
            useBlankPlaceholder: false,
            listener: this,
            pageActions: this.get('model.page_actions'),
        });
        this.get('browseHistory').clear();
        Ember.run.next(() => {
            if(this.get('url')) {
                this.loadUrl(this.get('url'), this.get('baseurl'));
                this.set('url', null);
                this.set('baseurl', null);
            }
        });
    },

    _willLeave: function() { // willLeave spider.index controller
        this.set('documentView.sprites', new SpriteStore());
        this.get('pendingUrls').clear();
        this.get('documentView').hideLoading();
        this.get('documentView.ws').send({'_command': 'close_tab'});
    },
});
