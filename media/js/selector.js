ASTool.DocumentView = Em.Object.extend({

	dataSource: null,

	listener: null,
	
	restrictToDescendants: false,
	
	_spritesBinding: 'dataSource.sprites',

	canvas: null,

	ignoredElementTags: ['html', 'body'],

	mouseDown: 0,

	loader: null,

	sprites: function() {
		if (!this.get('dataSource')) {
			return [];
		} else {
			return this.get('_sprites') || [];
		}
	}.property('_sprites.@each'),

	_elementSelectionEnabled: null,

	getIframe: function() {
		return $('#scraped-doc-iframe').contents();
	},
	
	elementSelectionEnabled: function(key, selectionEnabled) {
		if (arguments.length > 1) {
			if (selectionEnabled) {
			    if (!this.get('_elementSelectionEnabled')) {
					this.set('_elementSelectionEnabled', true);
					this.showHoveredInfo();
					this.installEventHandlersForSelecting();
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

	reset: function() {
		this.uninstallEventHandlers();
		this.set('elementSelectionEnabled', false);
		this.set('partialSelectionEnabled', false);
		this.set('dataSource', null);
		this.set('listener', null);	
	},

	config: function(options) {
		this.set('dataSource', options.dataSource);
		this.set('listener', options.listener);
		if (options.mode == 'select') {
			this.set('elementSelectionEnabled', true);
			this.set('partialSelectionEnabled', options.partialSelects);
		} else if (options.mode == 'browse') {
			this.installEventHandlersForBrowsing();
		}
	},
	
	redrawNow: function() {
		if (this.get('dataSource')) {
			this.get('canvas').draw();	
		}
	}.observes('sprites'),

	installEventHandlersForBrowsing: function() {
		this.uninstallEventHandlers();
		this.getIframe().bind('click', null, this.clickHandlerBrowse.bind(this));
	},

	installEventHandlersForSelecting: function() {
		this.uninstallEventHandlers();
		this.getIframe().bind('click', null, this.clickHandler.bind(this));
		this.getIframe().bind('mouseover', null, this.mouseOverHandler.bind(this));
		this.getIframe().bind('mouseout', null, this.mouseOutHandler.bind(this));
		this.getIframe().bind('mousedown', null, this.mouseDownHandler.bind(this));
		this.getIframe().bind('mouseup', null, this.mouseUpHandler.bind(this));
		this.getIframe().bind('hover', null, function(event) {event.preventDefault()});
		this.redrawNow();
	},

	uninstallEventHandlers: function() {
		this.getIframe().unbind('click');
		this.getIframe().unbind('mouseover');
		this.getIframe().unbind('mouseout');
		this.getIframe().unbind('mousedown');
		this.getIframe().unbind('mouseup');
		this.getIframe().unbind('hover');
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
		var range = this.getIframe().get(0).getSelection();
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
		if (!Ember.testing){
			// Disable automatic redrawing during tests.
			var self = this;
			this.set('autoRedrawId', setInterval(function() {
				Ember.run(function(){
					self.redrawNow();
				});
			}, 1000));
			window.onresize = function() {
				$('#scraped-doc-iframe').height(window.innerHeight * 0.99);
				$('#toolbar').height(window.innerHeight);
				this.get('canvas').draw();
				if (ASTool.graph) {
					// FIXME: move this to a good place.
					ASTool.graph.resize();
				}
			}.bind(this);
			var doc = document.getElementById('scraped-doc-iframe').contentWindow.document;
			doc.onscroll = canvas.draw.bind(canvas);
		}
	},

	displayAnnotatedDocument: function(annotatedDocument, readyCallback) {
		if (this.get('autoRedrawId')) {
			clearInterval(this.get('autoRedrawId'));
		}
		this.getIframe().find('html').html(annotatedDocument);
		if (!this.getCanvas) {
			this.initCanvas();	
		}
		// We need to disable all interactions with the document we are loading
		// until we trigger the callback.
		this.set('canvas.interactionsBlocked', true);
		Em.run.later(this, function() {
				this.set('canvas.interactionsBlocked', false);
				if (readyCallback) {
					readyCallback(this.getIframe());
				};
			}, 1000);
	},

	showLoading: function() {
		this.set('canvas.interactionsBlocked', true);
		var loader = this.get('loader');
		if (!loader) {
			loader = new CanvasLoader('loaderContainer');
			loader.setColor('#2398c2');
			loader.setShape('spiral');
			loader.setDiameter(133);
			loader.setRange(0.9);
			loader.setSpeed(1);
			loader.setFPS(60);
			var loaderObj = document.getElementById("canvasLoader");
		  	loaderObj.style.position = "absolute";
		  	loaderObj.style["top"] = loader.getDiameter() * -0.5 + "px";
		  	loaderObj.style["left"] = loader.getDiameter() * -0.5 + "px";
		  	this.set('loader', loader);
		}
		loader.show();
	},

	hideLoading: function() {
		if (this.get('loader')) { 
			this.get('loader').hide();
		}
	},

	showError: function(error) {
		this.getIframe().find('html').html(error);
	},

	showSpider: function() {
		if (!Ember.testing){
			ic.ajax('start.html').then(function(page) {
				this.getIframe().find('html').html(page);
			}.bind(this));
		}
	},

	getAnnotatedDocument: function() {
		return this.getIframe().find('html').get(0).outerHTML;
	},

	scrollToElement: function(element) {
		var rect = $(element).boundingBox();
		this.getIframe().scrollTop(rect.top - 100);
		this.getIframe().scrollLeft(rect.left - 100);
	},
});
