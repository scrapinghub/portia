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

jQuery.fn.getPath = function() {
	var path = [this.prop('tagName')];
	this.parents().not('html').each(function() {
		var entry = this.tagName.toLowerCase();
		path.push(entry);
	});
	return path.reverse().join(' > ');
};

jQuery.fn.getAttributeList = function() {
	var attributeList = [];
	if (this.text()) {
		attributeList.push(ASTool.Attribute.create({
			name: 'content',
			value: this.text()}));
	}
	var element = this.get(0);
	$(element.attributes).each(function() {
		if ($.inArray(this.nodeName, jQuery.fn.getAttributeList.ignoredAttributes) == -1 &&
			this.nodeValue) {
			attributeList.push(ASTool.Attribute.create({
				name: this.nodeName,
				value: this.nodeValue}));
		}
	});
	return attributeList;
};

jQuery.fn.getAttributeList.ignoredAttributes = ['id', 'class',
	'width', 'style', 'height', 'cellpadding',
	'cellspacing', 'border', 'bgcolor', 'color', 'colspan',
	'data-scrapy-annotate', 'data-tagid'];

jQuery.fn.boundingBox = function() {
	var rect = {};
	rect.left = this.offset().left;
	rect.top = this.offset().top;
	rect.width = this.outerWidth();
	rect.height = this.outerHeight();
	return rect;
};

jQuery.fn.isDescendant = function(parent) {
	return $(parent).find(this).length > 0;
};

jQuery.fn.findAnnotatedElements = function() {
	return this.find('[data-scrapy-annotate]');
};

jQuery.fn.findAnnotatedElement = function(annotationId) {
	var selector = '[data-scrapy-annotate*="' + annotationId + '"]';
	return this.find(selector);
};

jQuery.fn.findIgnoredElements = function(annotationId) {
	var selector;
	if (annotationId) {
		selector = '[data-scrapy-ignore*="' + annotationId + '"], [data-scrapy-ignore-beneath*="' + annotationId + '"]';
	} else {
		selector = '[data-scrapy-ignore], [data-scrapy-ignore-beneath]';
	}
	return this.find(selector);
};

jQuery.fn.removePartialAnnotation = function() {
	// FIXME: this may leave empty text node children.
	var element = this.get(0);
	var textNode = element.childNodes[0];
	var parentNode = element.parentNode;
	$(textNode).unwrap();
	parentNode.normalize();
};

jQuery.expr[':'].hasAttrWithPrefix = jQuery.expr.createPseudo(function(prefix) {
	return function(obj) {
		for (var i = 0; i < obj.attributes.length; i++) {
			if (obj.attributes[i].nodeName.indexOf(prefix) === 0) return true;
		}
		return false;
	};
});

String.prototype.lstrip = function() {
	return this.replace(/^[\s\r\n]*/g, "");
};