import Ember from 'ember';

import ApplicationUtils from '../../mixins/application-utils';
import WebDocument from '../web-document';
import interactionEvent from '../../utils/interaction-event';
import {patchDom, VirtualText, VirtualNode, VirtualPatch} from '../../utils/patch';

export default WebDocument.extend(ApplicationUtils, {
    ws_deferreds: {},
    previous_diff: '',

    connect: function() {
        this.get('ws').addCommand('fetch', function(data) {
            if (data.id && this.get('ws_deferreds.' + data.id)) {
                var deferred = this.get('ws_deferreds.' + data.id);
                this.get('ws').send({_command: 'extract'});
                this.set('currentUrl', data.url);
                if (data.error) {
                    deferred.reject(data);
                } else {
                    deferred.resolve(data);
                }
            }
        }.bind(this));

        this.get('ws').addCommand('interact', function(data) {
            if (data.diff && data.diff !== this.get('previous_diff')) {
                var updated = this.updateDOM(data.diff);
                if (updated) {
                    this.get('ws').send({_command: 'extract'});
                }
                this.set('previous_diff', data.diff);
                // TODO: Refresh followed links
                Ember.run.next(this, function() {
                    this.redrawNow();
                });
            }
        }.bind(this));

        this.get('ws').addCommand('loadStarted', function() {
            this.setInteractionsBlocked(true);
            this.showLoading();
        }.bind(this));

        this.get('ws').addCommand('extract', function(data) {
            if (this.get('listener') && this.get('listener').updateExtractedItems) {
                this.get('listener').set('followedLinks', data.links);
                this.get('listener').updateExtractedItems(data.items || []);
            }
        }.bind(this));

        this.get('ws').addCommand('loadFinished', function(data) {
            if (data.url === this.getWithDefault('currentUrl', data.url)) {
                return;
            }
            this.fetchDocument(null, null, null, 'loadCurrent').then(function(data) {
                this.displayDocument(data, function() {
                    this.reset();
                    this.set('loadedPageFp', data.fp);
                    this.set('followedLinks', data.links);
                    this.hideLoading();
                }.bind(this));
            }.bind(this));
        }.bind(this));

        setInterval(function() {
            if (this.get('loadingDoc')) {
                return;
            }
            this.get('ws').send({
                _command: 'updates',
                _callback: 'interact'
            });
        }.bind(this), 2000);
    }.on('init'),

    fetchDocument: function(url, spider, fp, command) {
        var unique_id = this.shortGuid(),
            deferred = new Ember.RSVP.defer(),
            ifWindow = document.getElementById(this.get('iframeId')).contentWindow;
        this.set('ws_deferreds.' + unique_id, deferred);
        this.get('ws').send({
            _meta: {
                spider: spider,
                project: this.get('slyd.project'),
                id: unique_id,
                viewport: ifWindow.innerWidth + 'x' + ifWindow.innerHeight,
                user_agent: navigator.userAgent,
            },
            _command: command || 'fetch',
            url: url
        });
        return deferred.promise;
    },

    /**
        Displays a document by setting it as the content of the iframe.
        readyCallback will be called when the document finishes rendering.
    */
    displayDocument: function(servedDoc, readyCallback) {
        Ember.run.schedule('afterRender', this, function() {
            this.set('loadingDoc', true);
            this.setIframeContent(servedDoc);
            // We need to disable all interactions with the document we are loading
            // until we trigger the callback.
            this.setInteractionsBlocked(true);
            Ember.run.later(this, function() {
                var doc = document.getElementById(this.get('iframeId')).contentWindow.document;
                doc.onscroll = this.redrawNow.bind(this);
                this.setInteractionsBlocked(false);
                if (readyCallback) {
                    readyCallback(this.getIframe());
                }
                this.set('loadingDoc', false);
            }, 800);
        });
    },

    setIframeContent: function(doc) {
        var iframe = Ember.$('#' + this.get('iframeId'));
        iframe.attr('srcdoc', doc.page || doc);
        this.set('document.iframe', iframe);
    },

    updateDOM: function(data) {
        var rootDocument = document.getElementById(this.get('iframeId')).contentDocument,
            root = rootDocument.body;
        if (!(data instanceof Object)) {
            data = JSON.parse(data);
        }
        var patch = this._buildPatch(data);
        patchDom(root, patch, rootDocument);
        return Object.keys(patch).length > 0;
    },

    _buildPatch: function(data) {
        var patch = {}, vpatch, sp;
        for (var key in data) {
            var value = data[key];
            if (value instanceof Array) {
                var patches = [];
                for (var i=0; i < value.length; i++) {
                    // Add patches
                    sp = value[i];
                    vpatch = this._makePatchObject(sp);
                    if (vpatch) {
                        patches.push(vpatch);
                    }
                }
                patch[key] = patches;
            } else {
                sp = value;
                vpatch = this._makePatchObject(sp);
                if (vpatch) {
                    patch[key] = vpatch;
                }
            }
        }
        return patch;
    },

    _makePatchObject: function(sp) {
        var vpatch, type = sp.type,
            vnode = sp.vNode instanceof Object ? sp.vNode : null;
        if(sp.patch) {
            if (sp.patch.text) {
                vpatch = new VirtualText(sp.patch.text);
            } else if (sp.patch && sp.patch.tagName) {
                vpatch = new VirtualNode(sp.patch.t,
                                         sp.patch.p,
                                         sp.patch.c,
                                         null,
                                         sp.patch.n);
                vpatch.key = sp.patch.key;
            } else {
                vpatch = sp.patch;
            }
        }
        if (!sp.patch || sp.patch && sp.patch.t !== 'script' &&
            sp.patch.t !== 'iframe') {
            return new VirtualPatch(type, vnode, vpatch);
        }
    },

    mouseOverHandler:  function(event) {
        event.preventDefault();
        var target = event.target;
        var tagName = Ember.$(target).prop("tagName").toLowerCase();
        if (Ember.$.inArray(tagName, this.get('ignoredElementTags')) === -1 &&
            !this.mouseDown) {
            if (!this.get('restrictToDescendants') ||
                    Ember.$(target).isDescendant(this.get('restrictToDescendants'))) {
                this.setElementHovered(target);
                this.sendElementHoveredEvent(target, 0, event.clientX, event.clientY);
            }
        }
    },

    mouseOutHandler: function() {
        this.set('hoveredSprite', null);

    },

    clickHandler: function(event) {
        event.preventDefault();
    },

    clickHandlerBrowse: function(evt) {
        var interaction = new interactionEvent(evt);
        interaction.type = 'click';
        this.get('ws').send({
            _meta: {
                spider: this.get('slyd.spider'),
                project: this.get('slyd.project'),
            },
            _command: 'interact',
            eventType: 'mouse',
            target: evt.target.getAttribute('data-tagid'),
            interaction: interaction
        });
        evt.preventDefault();
        var linkingElement = Ember.$(evt.target).closest('[href]');

        if (linkingElement.length > 0) {
            var href = Ember.$(linkingElement).get(0).href;
            if (href.length > 0 && href.search('#') === -1) {
                this.sendDocumentEvent('linkClicked', href);
            }
        }
    },

    scrollHandlerBrowse: function(evt) {
        if (this.getWithDefault('splashScrolling', false)) {
            return;
        }
        var ifWindow = document.getElementById(this.get('iframeId')).contentWindow,
            scrollState = {data: {scrollX: ifWindow.scrollX / Ember.$(ifWindow).width(),
                           scrollY: ifWindow.scrollY / Ember.$(ifWindow).height()}};
        this.get('ws').send({
            _meta: {
                spider: this.get('slyd.spider'),
                project: this.get('slyd.project'),
            },
            _command: 'interact',
            eventType: 'wheel',
            target: '-1',
            interaction: scrollState
        });
        this.set('splashScrolling', true);
        Ember.run.later(this, function() {
            this.set('splashScrolling', false);
        }, 500);
    },

    mouseDownHandler: function(event) {
        if (event.target.draggable) {
            // Disable dragging of images, links, etc...
            // This interferes with partial selection of links,
            // but it's a lesser evil than dragging.
            event.preventDefault();
        }
        this.set('hoveredSprite', null);
        this.set('mouseDown', true);
        this.redrawNow();
    },

    mouseUpHandler: function(event) {
        this.set('mouseDown', false);
        var selectedText = this.getIframeSelectedText();
        if (selectedText) {
            if (this.get('partialSelectionEnabled')) {
                if (selectedText.anchorNode === selectedText.focusNode) {
                    this.sendDocumentEvent(
                        'partialSelection', selectedText, event.clientX, event.clientY);
                } else {
                    alert('The selected text must belong to a single HTML element');
                    selectedText.collapse(this.getIframe().find('html').get(0), 0);
                }
            } else {
                selectedText.collapse(this.getIframe().find('html').get(0), 0);
            }
        } else if (event && event.target){
            var target = event.target;
            var tagName = Ember.$(target).prop("tagName").toLowerCase();
            if (Ember.$.inArray(tagName, this.get('ignoredElementTags')) === -1) {
                if (!this.get('restrictToDescendants') ||
                    Ember.$(target).isDescendant(this.get('restrictToDescendants'))) {
                    this.sendDocumentEvent('elementSelected', target, event.clientX, event.clientY);
                } else {
                    this.sendDocumentEvent('elementSelected', null);
                }
            }
        }
    },

    bindResizeEvent: function() {
        Ember.$(window).on('resize', Ember.run.bind(this, this.handleResize));
    }.on('init'),

    handleResize: function() {
        var iframe_window = document.getElementById(this.get('iframeId')).contentWindow;
        this.get('ws').send({
            _command: 'resize',
            _callback: 'heartbeat',
            size: iframe_window.innerWidth + 'x' + iframe_window.innerHeight
        });
    }
});
