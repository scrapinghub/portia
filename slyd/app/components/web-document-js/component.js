import Ember from 'ember';

import ApplicationUtils from '../../mixins/application-utils';
import WebDocument from '../web-document';
import interactionEvent from '../../utils/interaction-event';

/* global virtualDomPatchOp, virtualDomPatch, virtualDomNode, virtualDomText, convertHTML */

export default WebDocument.extend(ApplicationUtils, {
    ws: null,
    ws_deferreds: {},

    connect: function() {
        Ember.run.schedule('afterRender', function() {
            var ws = new WebSocket(this.get('slyd').getRootUrl().replace(/https?:\/\//, 'ws://') + '/ws/');
            ws.onopen = function(e) {
                console.log('<Opened Websocket>');
                setInterval(function() {
                    this.get('ws').send(JSON.stringify({'_command': 'heartbeat'}));
                }.bind(this), 5000);
            }.bind(this);
            ws.onclose = function(e) {
                console.log('<Closed Websocket>');
            };
            ws.onmessage = function(e) {
                var data;
                try {
                    data = JSON.parse(e.data);
                } catch (err) {
                    return;
                }
                if (data.id && this.get('ws_deferreds.' + data.id)) {
                    var deferred = this.get('ws_deferreds.' + data.id);
                    if (data.error) {
                        deferred.reject(data);
                    } else {
                        deferred.resolve(data);
                    }
                }
                if (data.diff) {
                    this.updateDOM(data.diff);
                    Ember.run.next(this, function() {
                        this.redrawNow();
                    });
                }
                if (data.state) {
                }

            }.bind(this);
            this.set('ws', ws);
        }.bind(this));
    }.on('init'),

    fetchDocument: function(url, spider, parentFp) {
        var unique_id = parentFp + this.shortGuid(),
            deferred = new Ember.RSVP.defer(),
            ifWindow = document.getElementById(this.get('iframeId')).contentWindow;
        this.set('ws_deferreds.' + unique_id, deferred);
        this.get('ws').send(JSON.stringify({
            _meta: {
                spider: spider,
                project: this.get('slyd.project'),
                id: unique_id,
                viewport: ifWindow.innerWidth + 'x' + ifWindow.innerHeight
            },
            _command: 'fetch',
            url: url
        }));
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
        var root = document.getElementById(this.get('iframeId')).contentDocument.body;
        //if (!(data instanceof Object)) {
        //     data = JSON.parse(data);
        // }
        // var patch = this._buildPatch(data, root);
        // virtualDomPatchOp(root, patch);
        root.innerHTML = data;
    },

    _buildPatch: function(data, root) {
        var patch = {}, vpatch, sp, type, vnode;
        for (var key in data) {
            var value = data[key];
            if (value instanceof Array) {
                var patches = [];
                for (var i=0; i < value.length; i++) {
                    // Add patches
                    sp = value[i];
                    type = sp.type;
                    vnode = sp.vNode instanceof Object ? sp.vNode : null;
                    if(sp.patch) {
                        if (sp.patch.text) {
                            vpatch = new virtualDomText(sp.patch.text);
                        } else {
                            vpatch = new virtualDomNode(sp.patch.tagName,
                                                        sp.patch.properties,
                                                        sp.patch.children,
                                                        sp.patch.key,
                                                        sp.patch.namespace);
                        }
                    }
                    if (!sp.patch || sp.patch && sp.patch.tagName !== 'script') {
                        patches.push(new virtualDomPatch(type, vnode, vpatch));
                    }
                    vpatch = undefined;
                }
                patch[key] = patches;
            } else {
                sp = value;
                type = sp.type;
                vnode = sp.vNode instanceof Object ? sp.vNode : null;
                if(sp.patch) {
                    if (sp.patch.text) {
                        vpatch = new virtualDomText(sp.patch.text);
                    } else {
                        vpatch = new virtualDomNode(sp.patch.tagName,
                                                    sp.patch.properties,
                                                    sp.patch.children,
                                                    sp.patch.key,
                                                    sp.patch.namespace);
                    }
                }
                if (!sp.patch || sp.patch && sp.patch.tagName !== 'script') {
                    patch[key] = new virtualDomPatch(type, vnode, vpatch);
                }
            }
        }
        patch['a'] = convertHTML(root.outerHTML);
        return patch;
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
        this.get('ws').send(JSON.stringify({
            _meta: {
                spider: this.get('slyd.spider'),
                project: this.get('slyd.project'),
            },
            _command: 'interact',
            eventType: 'mouse',
            target: evt.target.getAttribute('data-tagid'),
            interaction: interaction
        }));
        evt.preventDefault();
        var linkingElement = Ember.$(evt.target).closest('[href]');

        if (linkingElement.length > 0) {
            var href = Ember.$(linkingElement).get(0).href;
            if (href.length > 0 && href.search('#') == -1) {
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
        this.get('ws').send(JSON.stringify({
            _meta: {
                spider: this.get('slyd.spider'),
                project: this.get('slyd.project'),
            },
            _command: 'interact',
            eventType: 'wheel',
            target: '-1',
            interaction: scrollState
        }));
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
});
