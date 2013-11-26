var appController;
var iframe;
var canvas;
var hoveredSprite = null;
var ignoredElementTags = ['html', 'body'];
var ignoredAttributes = ['id', 'class', 'width', 'style', 'height', 'cellpadding',
	 					 'cellspacing', 'border', 'bgcolor', 'color', 'colspan',
						 'data-scrapy-annotate'];
var mouseDown = 0;
var autoRedrawId = null;
var drawMan = null;

function getPath(element) {
    var elementPath = [element.tagName.toLowerCase()];
    $(element).parents().not('html').each(function() {
        var entry = this.tagName.toLowerCase();
        elementPath.push(entry);
    });
    return elementPath.reverse().join(' > ');
}

function getAttributeList(element) {
	var attributeList = [];
	if ($(element).text()) {
		attributeList.push(ASTool.Attribute.create({
			name: 'content',
			value: $(element).text()}));
	}
	$(element.attributes).each(function() {
		if ($.inArray(this.nodeName, ignoredAttributes) == -1 &&
		    this.nodeValue) {
			attributeList.push(ASTool.Attribute.create({
				name: this.nodeName,
				value: this.nodeValue}));
		}
	})
	return attributeList;
}

function updateHoveredInfo(element) {
	var path = getPath(element);
	var attributes = getAttributeList(element);
	var contents = '<div>' + path + '</div><hr style="background-color:#FCDDB1;"/>';
	$(attributes).each(function(i, attribute) {
		var value = attribute.get('value');
		if (value.length > 100) {
			value = value.substring(0, 100) + '...';
		}
		contents += '<div class="hoveredInfoLine">' + attribute.get('name') + ": " + value + '</div>';
	});
	$("#hoveredInfo").html(contents);
}

function mouseOverHandler(event) {
	event.preventDefault();
	target = event.target;
	if ($.inArray($(target).prop("tagName").toLowerCase(), ignoredElementTags) == -1 &&
		mouseDown == 0) {
		var documentView = appController.documentView;
		if (!documentView.get('restrictToDescendants') ||
			isDescendant(target, documentView.get('restrictToDescendants'))) {
			if (!hoveredSprite) {
				updateHoveredInfo(target);
				hoveredSprite = ASTool.ElementSprite.create({'element': target});
				drawMan.draw();
			}
		}
	}
}
	
function mouseOutHandler(event) {
	var textbox = $('#current-elem');
	textbox.val("");
	hoveredSprite = null;
	drawMan.draw();
}

function clickHandler(event) {
	event.preventDefault();
}

function mouseDownHandler(event) {
	hoveredSprite = null;
	++mouseDown;
	drawMan.draw();
}

function mouseUpHandler(event) {
	--mouseDown;
	selectedText = getIframeSelectedText();
	
	if (selectedText) {
		if (selectedText.anchorNode == selectedText.focusNode) {
			sendEvent('partialSelection', selectedText);
		} else {
			alert('The selected text must belong to a single HTML element');
			selectedText.collapse();
		}
	} else {
		var target = event.target;
		if ($.inArray($(target).prop("tagName").toLowerCase(), ignoredElementTags) == -1) {
			var documentView = appController.documentView;
			if (!documentView.get('restrictToDescendants') ||
				isDescendant(target, documentView.get('restrictToDescendants'))) {
				sendEvent('elementSelected', target);
			} else {
				sendEvent('elementSelected', null);
			}
		}
	}
}

function sendEvent(name, target) {
	var documentListener = appController.get('documentListener');
	if (documentListener && documentListener.get('documentActions')[name]) {
		documentListener.get('documentActions')[name].bind(documentListener)(target);
	}
}

function getIframeSelectedText() {
	var range = iframe.get(0).getSelection();
	if (range && !range.isCollapsed) {
		return range;
	} else {
		return null;
	}
}

function installEventHandlers() {
	if (iframe) {
		uninstallEventHandlers();
		iframe.bind('click', null, clickHandler);
		iframe.bind('mouseover', null, mouseOverHandler);
		iframe.bind('mouseout', null, mouseOutHandler);
		iframe.bind('mousedown', null, mouseDownHandler);
		iframe.bind('mouseup', null, mouseUpHandler);
		iframe.bind('hover', null, function(event) {event.preventDefault()});
		drawMan.draw();
	}
}

function uninstallEventHandlers() {
	iframe.unbind('click');
	iframe.unbind('mouseleave');
	iframe.unbind('mouseover');
	iframe.unbind('mouseout');
	iframe.unbind('mousedown');
	iframe.unbind('mouseup');
	iframe.unbind('hover');	
	selection = null;
	hoveredSprite = null;
}

function showHoveredInfo() {
	$("#hoveredInfo").css('display', 'inline');
}

function hideHoveredInfo() {
	$("#hoveredInfo").css('display', 'none');
}

function initCanvas() {
	$('#scraped-doc-iframe').height(window.innerHeight * 0.99);
	$('#toolbar').height(window.innerHeight);
	_canvas = $('#infocanvas');
	canvas = _canvas.get(0);
	canvas.width = _canvas.outerWidth();
	canvas.height = _canvas.outerHeight();
};

function initIframe(callback) {
	
	$('#scraped-doc-iframe').load(callback);
	iframe = $('#scraped-doc-iframe').contents();
	// FIXME
	drawMan = ASTool.Canvas.create();
	setTimeout(callback, 1000);
	autoRedrawId = setInterval(drawMan.draw.bind(drawMan), 1000);
	drawMan.appController = appController;

	var doc = document.getElementById("scraped-doc-iframe").contentWindow.document;
	doc.onscroll = drawMan.draw.bind(drawMan);
}

function findInAnnotatedDoc(path) {
	if (iframe) {
		return iframe.find(path);
	} else {
		return null;
	}
}

function findAnnotatedElements() {
	if (iframe) {
		return iframe.find('[data-scrapy-annotate]');	
	} else {
		return [];
	}
	
}

function findAnnotatedElement(annotationId) {
	var selector = '[data-scrapy-annotate*="' + annotationId + '"]';
	return iframe.find(selector);
}

function findIgnoredElements(annotationId) {
	var selector = '[data-scrapy-ignore*="' + annotationId + '"]';
	return iframe.find(selector);
}

function removePartialAnnotation(insElement) {
	// FIXME: this may leave empty text node children.
	var textNode = insElement.childNodes[0];
	var parentNode = insElement.parentNode;
	$(textNode).unwrap();
	parentNode.normalize();
}

window.onresize = function() {
	drawMan.draw();
	$('#scraped-doc-iframe').height(window.innerHeight * 0.99);
	$('#toolbar').height(window.innerHeight);
}

jQuery.fn.getUniquePath = function () {
	if (this.length != 1) {
		throw 'Requires one element.';	
	}
	var path, node = this;
	while (node.length) {
		var realNode = node[0], name = realNode.localName;
		if (!name) {
			break;
		} 
		name = name.toLowerCase();
		var parent = node.parent();
		var siblings = parent.children(name);
		if (siblings.length > 1) { 
			name += ':eq(' + siblings.index(realNode) + ')';
		}
		path = name + (path ? '>' + path : '');
		node = parent;
	}
	return path;
};

jQuery.fn.boundingBox = function() {
	var rect = {};
	rect.left = this.offset().left;
	rect.top = this.offset().top;
	rect.width = this.outerWidth();
	rect.height = this.outerHeight();
	return rect;
}

function getSiblingIndex(element){
	var siblings = element.parentNode.childNodes;
	for (var i = 0; i < siblings.length; i++) {
		if (element == siblings[i]) {
			return i;
		}
	}
	return -1;
}

function isDescendant(descendant, parent) {
	return $(parent).find(descendant).length > 0;
}

function loadAnnotatedDocument(pageUrl, loaded, controller) {
	$('#scraped-doc-iframe').contents().find('html').html('<html><body>Loading...</body></html>');
	if (autoRedrawId) {
		clearInterval(autoRedrawId);
	}
	
	if (!canvas) {
		initCanvas();
	}
	appController = controller;
	hash = {};
	hash.type = 'POST';
	hash.data = JSON.stringify({spider: 'test', request: {url: pageUrl}});
	hash.success = function(data) {
		$('#scraped-doc-iframe').contents().find('html').html(data.page);
		initIframe(loaded);
	};
	hash.error = function(req, status, error) {
		console.log(error);
	};
	// FIXME: hardcode dummy 'test' project
	hash.url = 'http://localhost:9001/api/test/bot/fetch';
	$.ajax(hash);
}

function s4() {
	return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
};

function guid() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}
