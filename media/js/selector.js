var iframe;
var canvas;
var selection = null;
var hoveredElement = null;
var selectionListener = null;
var _annotations = [];
var ignoredElementTags = ['html', 'body'];
var ignoredAttributes = ['id', 'class', 'width', 'style', 'height', 'cellpadding',
	 					 'cellspacing', 'border', 'bgcolor', 'color', 'colspan'];

function highlight(ctx, element, fillColor, strokeColor, dashed, text) {
	var y_offset = iframe.scrollTop();
	var x_offset = iframe.scrollLeft();
	
	ctx.save();
	
	if (text) {
		ctx.fillStyle='#555';
		ctx.font = "bold 12px sans-serif";
		ctx.fillText(text,
				 	 element.offset().left - x_offset + 4,
			 		 element.offset().top - y_offset - 1);
	}
	
    ctx.shadowColor   = '#000';
    ctx.shadowOffsetX = 3;
    ctx.shadowOffsetY = 3;
    ctx.shadowBlur    = 16;
	
	ctx.fillStyle=fillColor;
	ctx.fillRect(element.offset().left - x_offset + 2,
		         element.offset().top - y_offset + 2,
				 element.outerWidth(),
				 element.outerHeight());
				 
	if (dashed) {
		ctx.setLineDash([4,3]);
	} 
    ctx.lineWidth=1;
	ctx.strokeStyle=strokeColor;
	ctx.strokeRect(element.offset().left - x_offset + 2,
		           element.offset().top - y_offset + 2,
				   element.outerWidth(),
				   element.outerHeight());
	
	ctx.restore();
    
}

function redrawCanvas() {
	_canvas = $('#infocanvas');
	canvas = _canvas.get(0);
	canvas.width = _canvas.outerWidth();
	canvas.height = _canvas.outerHeight();
	
	var ctx=canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	// Draw the annotated areas.
	
	_annotations.forEach(function(annotation) {
		var path = annotation.get('path');
		if (path && path.length) {
			if (path != selection && path != hoveredElement) {
				var annotatedElement = findInAnnotatedDoc(path);
				if (annotatedElement) {				
					highlight(ctx, annotatedElement, "rgba(88,120,220,0.3)", "white", false, annotation.get('name'));
				}	
			}	
		}
		
	}, _annotations);
	
	// Draw the currently hovered item.
	if (hoveredElement) {
		highlight(ctx, findInAnnotatedDoc(hoveredElement), "rgba(0,255,0,0.3)", "orange");
	}
	// Draw the current selection.
	if (selection) {
		highlight(ctx, findInAnnotatedDoc(selection), "rgba(88,120,220,0.3)", "white", true);
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
	if ($.inArray($(target).prop("tagName").toLowerCase(), ignoredElementTags) == -1) {
		if (!hoveredElement) {
			updateHoveredInfo(target);
			hoveredElement = $(target).getUniquePath();
			if (selection == hoveredElement) {
				return;
			}
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
	var target = event.target;
	selectionListener.set('attributes', getAttributeList(target));
	var targetPath = $(target).getUniquePath();
	selectionListener.set('path', targetPath);
	selection = targetPath;
	hoveredElement = null;
	event.preventDefault();
	redrawCanvas();
}

function iframeLeftHandler(event) {
	/*
	if (selectionListener) {
		if (selection) {
			console.log(getAttributeList(findInAnnotatedDoc(selection)).length);
			selectionListener.set('attributes', getAttributeList(findInAnnotatedDoc(selection)[0]));
		} else {
			selectionListener.set('attributes', []);
		}
	}*/
}

function installEventHandlers(listener) {
	console.log(iframe);
	selectionListener = listener;
	if (iframe) {
		iframe.click(clickHandler);
		iframe.bind('mouseleave', null, iframeLeftHandler)
		iframe.find('body').bind('mouseover', null, mouseOverHandler);
		iframe.find('body').bind('mouseout', null, mouseOutHandler);
		redrawCanvas();
		if (selection) {
			selectionListener.set('attributes',
				getAttributeList(findInAnnotatedDoc(selection)[0]));
		}
	
	}
}

function uninstallEventHandlers() {
	selectionListener = null;
	iframe.find('body').unbind('mouseover');
	iframe.find('body').unbind('mouseout');
	iframe.unbind('click');
	selection = null;
	hoveredElement = null;
}

function initCanvas() {
	$('#scraped-doc-iframe').height(window.innerHeight * 0.99);
	$('#toolbar').height(window.innerHeight);
	_canvas = $('#infocanvas');
	canvas = _canvas.get(0);
	canvas.width = _canvas.outerWidth();
	canvas.height = _canvas.outerHeight();	
	setInterval(redrawCanvas, 1000);
	$('#scraped-doc-iframe').attr('src', "hoffman.html");  
	$('#scraped-doc-iframe').bind('load', function() {
		console.log('iframe reloaded');
		var doc = document.getElementById("scraped-doc-iframe").contentWindow.document;
		doc.onscroll = redrawCanvas;
		iframe = $('#scraped-doc-iframe').contents();
		if (selectionListener) {
			// Reinstall handlers after reload.
			installEventHandlers(selectionListener);
		}
	});	 
};

function findInAnnotatedDoc(path) {
	return iframe.find(path);
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
