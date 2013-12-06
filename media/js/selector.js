ASTool.DocumentView = Em.Object.extend({

	displayedPageId: null,

	dataSource: null,

	listener: null,

	iframe: null,
	
	restrictToDescendants: false,
	
	_spritesBinding: 'dataSource.sprites',

	canvas: null,

	ignoredElementTags: ['html', 'body'],

	mouseDown: 0,

	sprites: function() {
		if (!this.get('dataSource')) {
			return [];
		} else {
			return this.get('_sprites');
		}
	}.property('_sprites.@each'),

	_elementSelectionEnabled: null,
	
	elementSelectionEnabled: function(key, selectionEnabled) {
		if (arguments.length > 1) {
			if (selectionEnabled) {
			    if (!this.get('_elementSelectionEnabled')) {
					this.set('_elementSelectionEnabled', true);
					this.showHoveredInfo();
					this.installEventHandlers();
				}
			} else {
				this.set('_elementSelectionEnabled', false);
				this.uninstallEventHandlers();
				this.hideHoveredInfo();
			}
		} else {
			return this.get('_elementSelectionEnabled');
		}
	}.property('_elementSelectionEnabled'),

	partialSelectionEnabled: false,
	
	redrawNow: function() {
		this.get('canvas').draw();
	}.observes('sprites'),

	installEventHandlersForBrowse: function() {
		this.uninstallEventHandlers();
		console.log('Installing browse events');
		this.iframe.bind('click', null, this.clickHandlerBrowse.bind(this));
	},

	installEventHandlers: function() {
		this.uninstallEventHandlers();
		this.iframe.bind('click', null, this.clickHandler.bind(this));
		this.iframe.bind('mouseover', null, this.mouseOverHandler.bind(this));
		this.iframe.bind('mouseout', null, this.mouseOutHandler.bind(this));
		this.iframe.bind('mousedown', null, this.mouseDownHandler.bind(this));
		this.iframe.bind('mouseup', null, this.mouseUpHandler.bind(this));
		this.iframe.bind('hover', null, function(event) {event.preventDefault()});
		this.get('canvas').draw();
	},

	uninstallEventHandlers: function() {
		this.iframe.unbind('click');
		this.iframe.unbind('mouseover');
		this.iframe.unbind('mouseout');
		this.iframe.unbind('mousedown');
		this.iframe.unbind('mouseup');
		this.iframe.unbind('hover');	
		this.set('hoveredSprite', null);
	},

	showHoveredInfo: function() {
		$("#hoveredInfo").css('display', 'inline');
	},

	hideHoveredInfo: function() {
		$("#hoveredInfo").css('display', 'none');
	},

	updateHoveredInfo: function(element) {
		var path = $(element).getPath();
		var attributes = $(element).getAttributeList();
		var contents = '<div class="hoveredPathLine">' + path + '</div><hr style="background-color:#2779aa;"/>';
		$(attributes).each(function(i, attribute) {
			var value = trim(attribute.get('value'), 60);
			contents += '<div class="hoveredInfoLine">' + attribute.get('name') + ": " + value + '</div>';
		});
		$("#hoveredInfo").html(contents);
	},

	mouseOverHandler:  function(event) {
		event.preventDefault();
		var target = event.target;
		var tagName = $(target).prop("tagName").toLowerCase();
		if ($.inArray(tagName, this.get('ignoredElementTags')) == -1 &&
			this.mouseDown == 0) {
			if (!this.get('restrictToDescendants') ||
				$(target).isDescendant(this.get('restrictToDescendants'))) {
				if (!this.get('hoveredSprite')) {
					this.updateHoveredInfo(target);
					this.set('hoveredSprite',
							 ASTool.ElementSprite.create({'element': target}));
					this.get('canvas').draw();
				}
			}
		}
	},
	
	mouseOutHandler: function(event) {
		this.set('hoveredSprite', null);
		this.get('canvas').draw();
	},

	clickHandler: function(event) {
		event.preventDefault();
	},

	clickHandlerBrowse: function(event) {
		console.log('Click handler browse');
		event.preventDefault();
		var linkingElement = $(event.target).closest('[href]');
		if (linkingElement.length) {
			var href = $(linkingElement).attr('href');
        	this.sendEvent('linkClicked', href);	
		}
	},

	mouseDownHandler: function(event) {
		this.set('hoveredSprite', null);
		++this.mouseDown;
		this.get('canvas').draw();
	},

	mouseUpHandler: function(event) {
		--this.mouseDown;
		var selectedText = this.getIframeSelectedText();
		if (selectedText) {
			if (this.get('partialSelectionEnabled')) {
				if (selectedText.anchorNode == selectedText.focusNode) {
					this.sendEvent('partialSelection', selectedText);
				} else {
					alert('The selected text must belong to a single HTML element');
					selectedText.collapse();
				}
			} else {
				selectedText.collapse();
			}
		} else {
			var target = event.target;
			var tagName = $(target).prop("tagName").toLowerCase();
			if ($.inArray(tagName, this.get('ignoredElementTags')) == -1) {
				if (!this.get('restrictToDescendants') ||
					$(target).isDescendant(this.get('restrictToDescendants'))) {
					this.sendEvent('elementSelected', target);
				} else {
					this.sendEvent('elementSelected', null);
				}
			}
		}
	},

	sendEvent: function(name, target) {
		var actions = this.get('listener.documentActions');
		if (actions && actions[name]) {
			actions[name].bind(this.get('listener'))(target);
		}
	},

	getIframeSelectedText: function() {
		var range = this.iframe.get(0).getSelection();
		if (range && !range.isCollapsed) {
			return range;
		} else {
			return null;
		}
	},

	initCanvas: function() {
		var canvas = ASTool.Canvas.create({canvasId: 'infocanvas',
										   datasource: this})
		this.set('canvas', canvas);
		this.set('autoRedrawId', setInterval(canvas.draw.bind(canvas), 1000));
		window.onresize = function() {
			$('#scraped-doc-iframe').height(window.innerHeight * 0.99);
			$('#toolbar').height(window.innerHeight);
			this.get('canvas').draw();
		}.bind(this);
		var doc = document.getElementById('scraped-doc-iframe').contentWindow.document;
		doc.onscroll = canvas.draw.bind(canvas);
	},

	displayAnnotatedDocument: function(annotatedDocument, pageId, readyCallback) {
		this.set('displayedPageId', pageId);
		this.iframe = $('#scraped-doc-iframe').contents();
		if (this.get('autoRedrawId')) {
			clearInterval(this.get('autoRedrawId'));
		}
		this.iframe.find('html').html(annotatedDocument);
		if (!this.getCanvas) {
			this.initCanvas();	
		}
		// We need to disable all interactions with the document we are loading
		// until we trigger the callback.
		this.set('canvas.interactionsBlocked', true);
		setTimeout(function(){
			this.set('canvas.interactionsBlocked', false);
			readyCallback(this.iframe);
		}.bind(this), 1000);
	},

	showLoading: function() {
		this.set('displayedPageId', null);
		this.iframe = $('#scraped-doc-iframe').contents();
		$('#scraped-doc-iframe').attr('src', 'loading.html');
	},

	showSpider: function() {
		this.set('displayedPageId', null);
		this.iframe = $('#scraped-doc-iframe').contents();
		$('#scraped-doc-iframe').attr('src', 'start.html');
	},

	getAnnotatedDocument: function() {
		return this.iframe.find('html').get(0).outerHTML;
	},
});

window.onresize = function() {
	$('#scraped-doc-iframe').height(window.innerHeight * 0.99);
	$('#toolbar').height(window.innerHeight);
}
