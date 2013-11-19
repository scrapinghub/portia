var appController;
var iframe;
var canvas;
var hoveredElement = null;
var ignoredElementTags = ['html', 'body'];
var ignoredAttributes = ['id', 'class', 'width', 'style', 'height', 'cellpadding',
	 					 'cellspacing', 'border', 'bgcolor', 'color', 'colspan'];
var mouseDown = 0;
var autoRedrawId = null;

function highlightElement(ctx, element, fillColor, strokeColor, dashed, text) {
	var y_offset = iframe.scrollTop();
	var x_offset = iframe.scrollLeft();
	var rect = {};
	rect.left = element.offset().left - x_offset;
	rect.top = element.offset().top - y_offset;
	rect.width = element.outerWidth();
	rect.height = element.outerHeight();
	highlightRect(ctx, rect, fillColor, strokeColor, dashed, text);
}

function highlightRect(ctx, rect, fillColor, strokeColor, dashed, text) {
	ctx.save();
	if (text) {
		ctx.fillStyle='#555';
		ctx.font = "bold 12px sans-serif";
		ctx.fillText(text,
				 	 rect.left + 4,
			 		 rect.top - 1);
	}
	
    ctx.shadowColor   = '#000';
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur    = 16;
	
	ctx.fillStyle=fillColor;
	ctx.fillRect(rect.left + 2,
		         rect.top + 2,
				 rect.width,
				 rect.height);
				 
	if (dashed) {
		ctx.setLineDash([2,2]);
	} 
    ctx.lineWidth=1;
	ctx.strokeStyle=strokeColor;
	ctx.strokeRect(rect.left + 2,
		           rect.top + 2,
				   rect.width,
				   rect.height);
	ctx.restore();
}

function redrawCanvas() {
	var documentView = appController.get('documentView');
	
	if (!documentView) {
		console.log('in redraw, documentView is not defined...');
		console.log(appController);
		return;
	}
	
	_canvas = $('#infocanvas');
	canvas = _canvas.get(0);
	canvas.width = _canvas.outerWidth();
	canvas.height = _canvas.outerHeight();
	
	var ctx=canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// Draw the annotated areas.
	
	var highLighted = documentView.get('highlightedElements');
	if (highLighted) {
		highLighted.forEach(function(element) {
			if (element) {
				highlightElement(ctx, $(element), "rgba(88,120,220,0.3)", "white", false, '');
			}
		});
	}
	
	// Draw the currently hovered item.
	if (hoveredElement) {
		highlightElement(ctx, $(hoveredElement), "rgba(0,255,0,0.3)", "orange");
	}
	// Draw the current selection.
	
	if (documentView.get('currentlySelectedElement')) {
		highlightElement(ctx, $(documentView.get('currentlySelectedElement')), "rgba(88,120,220,0.3)", "white", true);
		//highlightElement(ctx, findInAnnotatedDoc(selection), "rgba(88,120,220,0.3)", "white", true);
		/*if (selectionListener.get('isPartial')) {
			range = iframe.get(0).createRange();
			rangeOwner = findInAnnotatedDoc(selection).get(0);
			var node = rangeOwner.childNodes[selectionListener.get('selectedChildIndex')];
			range.setStart(node, selectionListener.get('startOffset'));
			range.setEnd(node, selectionListener.get('endOffset'));
			rects = range.getClientRects();
			for (var i = 0; i < rects.length; i++) {
				highlightRect(ctx, rects[i], "rgba(255,0,0,0.3)", "white", true);	
			}
		} else {
			highlightElement(ctx, findInAnnotatedDoc(selection), "rgba(88,120,220,0.3)", "white", true);
		}*/
	}
}

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
	target = event.target;
	event.preventDefault();
	if ($.inArray($(target).prop("tagName").toLowerCase(), ignoredElementTags) == -1 &&
		mouseDown == 0) {
		if (!hoveredElement) {
			updateHoveredInfo(target);
			hoveredElement = target;
			redrawCanvas();
		}
	}
}
	
function mouseOutHandler(event) {
	var textbox = $('#current-elem');
	textbox.val("");
	hoveredElement = null;
    redrawCanvas();
}

function clickHandler(event) {
	event.preventDefault();
}

function mouseDownHandler(event) {
	hoveredElement = null;
	++mouseDown;
	redrawCanvas();
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
		sendEvent('elementSelected', target);
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
		redrawCanvas();
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
	hoveredElement = null;
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
	var doc = document.getElementById("scraped-doc-iframe").contentWindow.document;
	doc.onscroll = redrawCanvas;
	$('#scraped-doc-iframe').load(callback);
	iframe = $('#scraped-doc-iframe').contents();
	// FIXME
	setTimeout(callback, 1000);
	autoRedrawId = setInterval(redrawCanvas, 1000);
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

function removePartialAnnotation(insElement) {
	// FIXME: this may leave empty text node children.
	var textNode = insElement.childNodes[0];
	var parentNode = insElement.parentNode;
	$(textNode).unwrap();
	parentNode.normalize();
}

window.onresize = function() {
	redrawCanvas();
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

function getSiblingIndex(element){
	var siblings = element.parentNode.childNodes;
	for (var i = 0; i < siblings.length; i++) {
		if (element == siblings[i]) {
			return i;
		}
	}
	return -1;
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
	hash.data = JSON.stringify({project: 'test', spider: 'test', request: {url: pageUrl}});
	hash.success = function(data) {
		$('#scraped-doc-iframe').contents().find('html').html(data.page);
		initIframe(loaded);
	};
	hash.error = function(req, status, error) {
		console.log(error);
	};
	hash.url = 'http://localhost:9001/bot/fetch';
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
