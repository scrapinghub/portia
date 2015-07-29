/* jshint scripturl:true */
import Ember from 'ember';
import ajax from 'ic-ajax';
import {Canvas, ElementSprite} from '../utils/canvas';
import AnnotationStore from '../utils/annotation-store';
var $ = Ember.$;

/* global CanvasLoader */

export default Ember.Component.extend({
    _register: function() {
        this.set('document.view', this); // documentView is a new property
    }.on('init'),

    didInsertElement: function() {
        Ember.run.scheduleOnce('afterRender', this, this.initData());
    },

    iframeId: 'scraped-doc-iframe',

    dataSource: null,

    sprites: [],

    listener: null,

    mode: "none", // How it responds to input events, modes are 'none', 'browse' and 'select'

    canvas: null,

    ignoredElementTags: ['html', 'body'],

    mouseDown: false,

    loader: null,

    loadingDoc: false,

    cssEnabled: true,

    annotationStore: null,

    spiderPage: null,
    spiderPageShown: true,

    redrawSprites: function() {
        this.redrawNow();
    }.observes('sprites.sprites.@each', 'sprites'),

    /**
        Attaches this documentview to a datasource and event listener
        configuring it according to the options dictionary.
        The options dictionary may contain:

        datasource: the datasource that will be attached.
        listener: the event listener will be attached.
        mode: a string. Possible values are 'select', 'browse' and 'none'.
        partialSelects: boolean. Whether to allow partial selections. It only
            has effect for the 'select' mode.
    */
    config: function(options) {
        this.set('dataSource', options.dataSource);
        this.set('listener', options.listener);
        this.set('mode', options.mode);
        if (options.mode === 'select') {
            this.set('partialSelectionEnabled', options.partialSelects);
        }
    },

    /**
        Detaches the datasource and event listener. Internally,
        it also unbinds all event handlers.
    */
    reset: function() {
        this.set('mode', 'none');
        this.set('partialSelectionEnabled', false);
        this.set('dataSource', null);
        this.set('listener', null);
    },

    /**
        Set this property to a DOM element if you want to restrict element
        selection to the children of the given element.
    */
    restrictToDescendants: null,

    /**
        Returns the document iFrame contents.
    */
    getIframe: function() {
        return Ember.$('#' + this.get('iframeId')).contents();
    },

    /**
        Returns the document iFrame node.
    */
    getIframeNode: function() {
        return Ember.$('#' + this.get('iframeId'))[0];
    },

    /**
        Redraws all datasource sprites and the hovered element (if in select
        mode). This method can be called manually but it gets called
        automatically:

            - Once 10 seconds.
            - After a window resize or iframe scroll.
            - The sprites exposed by the datasource change.
    */
    redrawNow: function() {
        var canvas = this.get('canvas');
        if (!canvas || this.loadingDoc) {
            return;
        }
        canvas = this.get('canvas');
        if (this.get('sprites.sprites')) {
            var sprites = this.get('sprites.sprites').copy();
            if (this.get('hoveredSprite')) {
                sprites = sprites.concat([this.get('hoveredSprite')]);
            }
            canvas.draw(sprites,
                        this.getIframe().scrollLeft(),
                        this.getIframe().scrollTop());
        } else {
            canvas.clear();
        }
    },

    clearNow: function() {
        this.get('canvas').clear();
    },

    /**
        Blocks/unblocks interactions with the document.
    */
    setInteractionsBlocked: function(blocked) {
        if (this.get('canvas.interactionsBlocked') !== blocked) {
            this.set('canvas.interactionsBlocked', blocked);
        }
    },

    /**
        Displays a document by setting it as the content of the iframe.
        readyCallback will be called when the document finishes rendering.
    */
    displayDocument: function(documentContents, readyCallback) {
        Ember.run.schedule('afterRender', this, function() {
            this.set('loadingDoc', true);
            this.setIframeContent(documentContents);
            this.spiderPageShown = false;
            // We need to disable all interactions with the document we are loading
            // until we trigger the callback.
            this.setInteractionsBlocked(true);
            Ember.run.later(this, function() {
                var doc = this.getIframeNode().contentWindow.document;
                doc.onscroll = this.redrawNow.bind(this);
                this.setInteractionsBlocked(false);
                if (readyCallback) {
                    readyCallback(this.getIframe());
                }
                this.set('loadingDoc', false);
            }, 800);
        });
    },

    /**
        Returns the content of the document currently displayed by the
        iframe.
    */
    getAnnotatedDocument: function() {
        return this.getIframe().find('html').get(0).outerHTML;
    },

    /**
        Displays a loading widget on top of the iframe. It should be removed
        by calling hideLoading.
    */
    showLoading: function() {
        this.setInteractionsBlocked(true);
        var loader = this.get('loader');
        if (!loader) {
            loader = new CanvasLoader('loader-container');
            loader.setColor('#2398b2');
            loader.setShape('spiral');
            loader.setDiameter(90);
            loader.setRange(0.9);
            loader.setSpeed(1.0);
            loader.setFPS(60);
            var loaderObj = document.getElementById("canvasLoader");
            loaderObj.style.position = "absolute";
            loaderObj.style["margin-left"] = -loader.getDiameter() / 2 + "px";
            loaderObj.style["margin-top"] = '180px';
            loaderObj.style["width"] = loader.getDiameter() + "px";
            loaderObj.style["left"] = '50%';
            this.set('loader', loader);
        }
        loader.show();
    },

    /**
        Hides the loading widget displayed by a previous call to showLoading.
    */
    hideLoading: function() {
        if (this.get('loader')) {
            this.get('loader').hide();
        }
        this.setInteractionsBlocked(false);
    },

    /**
        Displays the spider image place holder as the content of the
        iframe.
    */
    showSpider: function() {
        Ember.run.schedule('afterRender', this, function() {
            if (!Ember.testing) {
                if (this.spiderPage) {
                    this.getIframe().find('html').html(this.spiderPage);
                } else  {
                    Ember.run.throttle(this, this.reloadIframeContent, 500);
                }
                this.spiderPageShown = true;
            }
        });
    },

    toggleCSS: function() {
        var iframe = this.getIframe();
        if (this.cssEnabled) {
            iframe.find('link[rel="stylesheet"]').each(function() {
                Ember.$(this).renameAttr('href', '_href');
            });
            iframe.find('style').each(function() {
                var that = Ember.$(this);
                that.renameAttr('type', '_type');
                that.attr('type', 'text/disabled');
            });
            iframe.find('[style]').each(function() {
                Ember.$(this).renameAttr('style', '_style');
            });
        } else {
            iframe.find('link[rel="stylesheet"]').each(function() {
                Ember.$(this).renameAttr('_href', 'href');
            });
            iframe.find('style').each(function() {
                Ember.$(this).renameAttr('_type', 'type');
            });
            iframe.find('*[_style]').each(function() {
                Ember.$(this).renameAttr('_style', 'style');
            });
        }
        this.redrawNow();
        this.cssEnabled = !this.cssEnabled;
    },

    /**
        Scrolls the iframe so the given element appears in the current
        viewport.
    */
    scrollToElement: function(element) {
        var rect = Ember.$(element).boundingBox();
        this.updateHoveredInfo(element);
        this.getIframeNode().contentWindow.scrollTo(
            Math.max(0, parseInt(rect.left - 100)),
            Math.max(0, parseInt(rect.top - 100))
        );
    },

    _updateEventHandlers: function() {
        var mode = this.get('mode');
        if (mode === 'select') {
            this.showHoveredInfo();
            this.installEventHandlersForSelecting();
        } else if (mode === 'browse'){
            this.hideHoveredInfo();
            this.installEventHandlersForBrowsing();
        } else { // none
            this.hideHoveredInfo();
            this.uninstallEventHandlers();
        }
    }.observes('mode'),

    partialSelectionEnabled: false,

    installEventHandlersForBrowsing: function() {
        this.uninstallEventHandlers();
        this.getIframe().on('click.portia', this.clickHandlerBrowse.bind(this));
    },

    installEventHandlersForSelecting: function() {
        this.uninstallEventHandlers();
        var iframe = this.getIframe();
        iframe.on('click.portia', this.clickHandler.bind(this));
        iframe.on('mouseover.portia', this.mouseOverHandler.bind(this));
        iframe.on('mouseout.portia', this.mouseOutHandler.bind(this));
        iframe.on('mousedown.portia', this.mouseDownHandler.bind(this));
        iframe.on('mouseup.portia', this.mouseUpHandler.bind(this));
        iframe.on('hover.portia', function(event) {event.preventDefault();});
        this.redrawNow();
    },

    uninstallEventHandlers: function() {
        this.getIframe().off('.portia');
        this.set('hoveredSprite', null);
    },

    reloadIframeContent: function() {
        var iframe = Ember.$(this.getIframeNode());
        ajax({url: iframe.attr('src')}).then(function(data) {
            this.spiderPage = data || null;
            this.showSpider();
        }.bind(this));
    },

    getIframeContent: function() {
        var iframe = this.getIframe().get(0);
        return iframe.documentElement && iframe.documentElement.outerHTML;
    },

    setIframeContent: function(contents) {
        var iframe = this.getIframe();
        iframe.find('html').html(contents);
        this.set('document.iframe', iframe);
    },

    showHoveredInfo: function() {
        Ember.$("#hovered-element-info").css('display', 'inline');
    },

    hideHoveredInfo: function() {
        Ember.$("#hovered-element-info").css('display', 'none');
    },

    initHoveredInfo: function() {
        var contents = '<div>' +
            '<span class="path"/>' +
            '<button class="btn btn-light fa fa-icon fa-arrow-right"/>' +
            '</div>' +
            '<div class="attributes"/>';
        Ember.$('#hovered-element-info').html(contents);
        Ember.$('#hovered-element-info button').click(function() {
                var element = Ember.$('#hovered-element-info');
                var button = element.find('button');
                button.removeClass('fa-arrow-right');
                button.removeClass('fa-arrow-left');
                var floatPos = element.css('float');
                if (floatPos === 'left') {
                    floatPos = 'right';
                    button.addClass('fa-arrow-left');
                } else {
                    floatPos = 'left';
                    button.addClass('fa-arrow-right');
                }
                element.css('float', floatPos);
            });
    },

    updateHoveredInfo: function(element) {
        var jqElem = Ember.$(element),
            path = jqElem.getPath(),
            attributes = jqElem.getAttributeList();
        if (jqElem.prop('class')) {
            attributes.unshift({name: 'class', value: jqElem.prop('class')});
        }
        if (jqElem.prop('id')) {
            attributes.unshift({name: 'id', value: jqElem.prop('id')});
        }
        var $attributes = $('#hovered-element-info .attributes').empty();
        attributes.forEach(function(attribute) {
            var value = (attribute.value || "").trim().substring(0, 50);
            $attributes.append(
                $('<div class="attribute" style="margin:2px 0px 2px 0px"></div>').append(
                    $('<span/>').text(attribute.name + ': ')
                ).append(
                    $('<span style="color:#AAA"></span>').text(value)
                )
            );
        });
        $('#hovered-element-info .path').html(path);
    },

    sendElementHoveredEvent: function(element, delay, mouseX, mouseY) {
        var handle = this.get('elementHoveredHandle');
        if (handle) {
            Ember.run.cancel(handle);
            this.set('elementHoveredHandle', null);
        }
        if (delay) {
            handle = Ember.run.later(this, function() {
                this.sendDocumentEvent('elementHovered', element, mouseX, mouseY);
            }, delay);
            this.set('elementHoveredHandle', handle);
        } else {
            this.sendDocumentEvent('elementHovered', element, mouseX, mouseY);
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
        this.redrawNow();
    },

    clickHandler: function(event) {
        event.preventDefault();
    },

    clickHandlerBrowse: function(event) {
        if(event.which > 1 || event.ctrlKey) { // Ignore right/middle click or Ctrl+click
            return;
        }
        event.preventDefault();
        var linkingElement = Ember.$(event.target).closest('[href]');
        if (linkingElement.length) {
            var href = linkingElement.get(0).href;
            if (href && href.toLowerCase().indexOf('javascript:') !== 0) {
                this.sendDocumentEvent('linkClicked', href);
            }
        }
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

    sendDocumentEvent: function(name) {
        var actions = this.get('listener.documentActions');
        var args = Array.prototype.slice.call(arguments, 1);
        if (actions && actions[name]) {
            Ember.run(function(){
                actions[name].apply(this.get('listener'), args);
            }.bind(this));
        }
    },

    getIframeSelectedText: function() {
        var range = this.getIframe().get(0).getSelection();
        if (range && !range.isCollapsed) {
            return range;
        } else {
            return null;
        }
    },

    setElementHovered: function(element) {
        this.updateHoveredInfo(element);
        this.set('hoveredSprite',
                 ElementSprite.create({'element': element}));
        this.redrawNow();
    },

    initCanvas: function() {
        if (!this.get('canvas')) {
            this.set('canvas', Canvas.create({ canvasId: 'infocanvas' }));
            this.initHoveredInfo();
            if (!Ember.testing){
                window.resize = function() {
                    this.redrawNow();
                }.bind(this);
            }
        }
    },

    initData: function() {
        this.initCanvas();
        var store = new AnnotationStore(),
            iframe = this.getIframe();
        store.set('document', this.get('document'));
        this.set('document.store', store);
        this.set('document.iframe', iframe);
    },

    call: function() {}
});
