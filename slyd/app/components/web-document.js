/* jshint scripturl:true */
import Ember from 'ember';
import {Canvas, ElementSprite} from '../utils/canvas';
import AnnotationStore from '../utils/annotation-store';

var META_STYLE = `<style data-show-meta>
    head, title, meta, link {
        display: block;
        display: none\9;
    }
    title::before {
        content: 'Title: ';
    }
    meta[name][content]::after {
        content: attr(name) ': "' attr(content) '"';
    }
    meta[property][content]::after {
        content: attr(property) ': "' attr(content) '"';
    }
    meta[itemprop][content]::after {
        content: attr(itemprop) ': "' attr(content) '"';
    }
    link[href][rel]::after {
        content: 'Link: rel: "' attr(rel) '" href: "' attr(_portia_href) '"';
    }
    link[href][rel][media]::after {
        content: 'Link: rel: "' attr(rel) '" href: "' attr(_portia_href) '" media: "' attr(media) '"';
    }
    link[href][rel][type]::after {
        content: 'Link: rel: "' attr(rel) '" href: "' attr(_portia_href) '" type: "' attr(type) '"';
    }
    link[href][rel][type][media]::after {
        content: 'Link: rel: "' attr(rel) '" href: "' attr(_portia_href) '" type: "' attr(type) '" media: "' attr(media) '"';
    }
</style>`;

export default Ember.Component.extend({
    _register: function() {
        this.set('document.view', this); // documentView is a new property
    }.on('init'),

    didInsertElement: function() {
        this.initCanvas();
        var store = new AnnotationStore();
        var iframe = this.getIframe();
        store.set('document', this.get('document'));
        this.set('document.store', store);
        this.set('document.iframe', iframe);

        var iframeNode = this.getIframeNode();
        iframeNode.onload = this._updateEventHandlers.bind(this);
        iframeNode.onreadystatechange = this._updateEventHandlers.bind(this);
    },

    iframeId: 'scraped-doc-iframe',

    sprites: [],

    listener: null,

    mode: "uninitialized", // How it responds to input events, modes are 'none', 'browse' and 'select'
    useBlankPlaceholder: false,
    recording: false, // If we are currently recording page actions

    canvas: null,

    ignoredElementTags: ['html', 'body'],

    mouseDown: false,

    loader: null,

    loadingDoc: false,

    cssEnabled: true, // Only in "select" mode

    redrawSprites: function() {
        this.redrawNow();
    }.observes('sprites.sprites.@each', 'sprites'),

    /**
        Attaches this documentview to a event listener
        configuring it according to the options dictionary.
        The options dictionary may contain:

        listener: the event listener will be attached.
        pageActions: Array where to save page actions performed.
        mode: a string. Possible values are 'select', 'browse' and 'none'.
        partialSelects: boolean. Whether to allow partial selections. It only
            has effect for the 'select' mode.
        blankPage: boolean (default false). Whether to show a blank page or
            the placeholder page. Only has effect in "none" mode.
    */
    config: function(options) {
        this.set('listener', options.listener);
        this.set('pageActions', options.pageActions);
        if(options.mode && options.mode !== this.get('mode')) {
            this.set('cssEnabled', true);
            this.set('mode', options.mode);
            Ember.run.next(this, this.emptyIframe);
            this.set('loading', false);
            this.set('recording', false);
            this.set('currentUrl', '');
            this.set('currentFp', '');
        }
        if (options.mode === 'select') {
            this.set('partialSelectionEnabled', !!options.partialSelects);
        } else if (options.mode === 'none') {
            this.set('useBlankPlaceholder', !!options.blankPage);
        }
        // Block interactions when the spider page is open
        this.setInteractionsBlocked(this.get('mode') === 'none' && !this.get('useBlankPlaceholder'), 'spider-page');
    },

    /**
        Detaches the datasource and event listener. Internally,
        it also unbinds all event handlers.
    */
    reset: function() {
        this.config({
            mode: 'none',
        });
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

    interactionsBlockedReasons: new Set(),

    /**
     *  Adds/lifts a reason for interactions with the document to be blocked.
     *
     *  Interactions are blocked for as long as there is a "reason" for them
     *  to be blocked. This ensures that interactions are not unblocked by a
     *  different module/reasons that blocked them.
     */
    setInteractionsBlocked: function(blocked, reason="default") {
        var reasons = this.get('interactionsBlockedReasons');
        reasons[blocked?'add':'delete'](reason);
        this.set('canvas.interactionsBlocked', reasons.size > 0);
    },

    blockInteractions: function(reason){
        return this.setInteractionsBlocked(true, reason);
    },

    unblockInteractions: function(reason){
        return this.setInteractionsBlocked(false, reason);
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
        this.blockInteractions('loading');
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
        this.unblockInteractions('loading');
    },

    /**
     * Only works in "select" mode
     */
    toggleCSS: function() {
        this.assertInMode('select');
        var iframe = this.getIframe();
        if (this.get('cssEnabled')) {
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
            iframe.find('body').append($(META_STYLE));
        } else {
            iframe.find('[data-show-meta]').remove();
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
        this.toggleProperty('cssEnabled');
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
            this.installEventHandlersForSelecting();
        } else if (mode === 'browse'){
            this.installEventHandlersForBrowsing();
        } else { // none
            this.uninstallEventHandlers();
        }
    }.observes('mode'),

    emptyIframe: function() {
        var iframe = this.getIframeNode();
        iframe.removeAttribute('srcdoc');
        iframe.setAttribute('src', this.get('useBlankPlaceholder') ? 'about:blank' : '/static/start.html');
    },

    assertInMode: function(mode, msg) {
        if(this.get('mode') !== mode) {
            throw new Error(msg || ('documentView in incorrect mode ' + this.get('mode') + ' != ' + mode));
        }
    },

    partialSelectionEnabled: false,

    installEventHandlersForBrowsing: $.noop,

    installEventHandlersForSelecting: function() {
        this.uninstallEventHandlers();
        var iframe = this.getIframe();
        iframe.on('scroll.portia', this.redrawNow.bind(this));
        iframe.on('click.portia', this.clickHandler.bind(this));
        iframe.on('mouseover.portia', this.mouseOverHandler.bind(this));
        iframe.on('mouseout.portia', this.mouseOutHandler.bind(this));
        iframe.on('mousedown.portia', this.mouseDownHandler.bind(this));
        iframe.on('mouseup.portia', this.mouseUpHandler.bind(this));
        iframe.on('hover.portia', function(event) {event.preventDefault();});  // XXX: Why?
        this.redrawNow();
    },

    uninstallEventHandlers: function() {
        this.getIframe().off('.portia');
        this.set('hoveredSprite', null);
    },

    getIframeContent: function() {
        var iframe = this.getIframe().get(0);
        return iframe.documentElement && iframe.documentElement.outerHTML;
    },

    _updateHoveredInfoVisibility: function() {
        var display = this.get('mode') === 'select' ? 'inline': 'none';
        Ember.$("#hovered-element-info").css('display', display);
    }.observes('mode'),

    initHoveredInfo: function() {
        var contents = '<div class="path"/><div class="attributes"/>';
        var element = Ember.$('#hovered-element-info').html(contents)
            .mouseenter(function() {
                var floatPos = element.css('float');
                if (floatPos === 'left') {
                    floatPos = 'right';
                } else {
                    floatPos = 'left';
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
            var value = (attribute.value + "").trim().substring(0, 50);
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
        this.sendDocumentEvent('elementHovered', element, mouseX, mouseY);
    },

    mouseOverHandler:  function(event) {
        event.preventDefault();
        var target = event.target;
        if(!target || target.nodeType !== Node.ELEMENT_NODE) {
            // Ignore events on the document
            return;
        }
        var tagName = target.tagName.toLowerCase();
        if (Ember.$.inArray(tagName, this.get('ignoredElementTags')) === -1 &&
            !this.mouseDown) {
            if (!this.get('restrictToDescendants') ||
                    Ember.$(target).isDescendant(this.get('restrictToDescendants'))) {
                this.setElementHovered(target);
                this.sendElementHoveredEvent(target, event.clientX, event.clientY);
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
        } else if (event && event.target && event.target.nodeType === Node.ELEMENT_NODE){
            var target = event.target;
            var tagName = target.tagName.toLowerCase();
            if (Ember.$.inArray(tagName, this.get('ignoredElementTags')) === -1) {
                if (!this.get('restrictToDescendants') ||
                    Ember.$(target).isDescendant(this.get('restrictToDescendants'))) {
                    this.sendDocumentEvent('elementSelected', target, event.clientX, event.clientY);
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

    iframeSize: function(){
        var iframe_window = this.getIframeNode().contentWindow;
        if (iframe_window) {
            return iframe_window.innerWidth + 'x' + iframe_window.innerHeight;
        }
        return null;
    },

    initCanvas: function() {
        if (!this.get('canvas')) {
            this.set('canvas', Canvas.create({ canvasId: 'infocanvas' }));
            this.initHoveredInfo();
            if (!Ember.testing){
                window.resize = this.redrawNow.bind(this);
            }
        }
    },
});
