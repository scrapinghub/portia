/*************** Adapters & Serializers ****************/
ASTool.IFrameAdapter = DS.Adapter.extend({
	
	storageAttribute: null,

	iframeBinding: 'ASTool.iframe',
	
	generateIdForRecord: function(store, record) {
		return ASTool.guid();
	},
	
	find: function(store, type, id) {
		var annotatedElement = this.get('iframe').findAnnotatedElement(id);
		var annotationJSON = $.parseJSON($(annotatedElement).attr(this.get('storageAttribute')));
		return annotationJSON;
	},
	
	findAll: function(store, type) {
		var annotatedElements = this.get('iframe').findAnnotatedElements();
		var annotationsJSON = [];
		annotatedElements.each(function(i, element) {
			annotationsJSON.pushObject($.parseJSON($(element).attr(this.get('storageAttribute'))));
		}.bind(this));
		return annotationsJSON;
	},
	
	createRecord: function(store, type, record) {
		serializedRecord = store.serializerFor(type).serialize(record, { includeId: true });
		$(record.get('element')).attr(this.get('storageAttribute'), JSON.stringify(serializedRecord));
		return this.wrapInPromise(function() {
			return serializedRecord;
		}, this);
	},
	
	updateRecord: function(store, type, record) {
		serializedRecord = store.serializerFor(type).serialize(record, { includeId: true });
		var oldAnnotatedElement = this.get('iframe').findAnnotatedElement(record.get('id'));
		oldAnnotatedElement.removeAttr(this.get('storageAttribute'));
		$(record.get('element')).attr(this.get('storageAttribute'), JSON.stringify(serializedRecord));
		return this.wrapInPromise(function() {
			return serializedRecord;
		}, this);
	},
	
	deleteRecord: function(store, type, record) {
		if (record.get('isPartial') && record.get('element')) {
			$(record.get('element')).removePartialAnnotation();
		} else {
			$(record.get('element')).removeAttr(this.get('storageAttribute'));
		}
		return this.wrapInPromise(function(){}, this);
	},
	
	wrapInPromise: function(callback, context) {
		return new Ember.RSVP.Promise(function(resolve) {
			Ember.run.once(function() {
				resolve(callback.call(context));
			});
		});
	},
});


ASTool.AnnotationAdapter = ASTool.IFrameAdapter.extend({

	storageAttribute: 'data-scrapy-annotate',

	deleteRecord: function(store, type, record) {
		var ignoredElements = this.get('iframe').findIgnoredElements(record.get('id'));
		ignoredElements.removeAttr('data-scrapy-ignore');
		ignoredElements.removeAttr('data-scrapy-ignore-beneath');
		return this._super(store, type, record);
	},

	updateRecord: function(store, type, record) {
		var oldIgnoredElements = this.get('iframe').findIgnoredElements(record.get('id'));
		oldIgnoredElements.removeAttr('data-scrapy-ignore');
		oldIgnoredElements.removeAttr('data-scrapy-ignore-beneath');
		record.get('ignores').forEach(function(ignore) {
			var ignoreJSON = {id: record.get('id'), name: ignore.get('name')};
			var attrName = ignore.get('ignoreBeneath') ? 'data-scrapy-ignore-beneath' : 'data-scrapy-ignore';
			$(ignore.get('element')).attr(attrName, JSON.stringify(ignoreJSON));
		});
		return this._super(store, type, record);		
	},
});


ASTool.SlydAdapter = DS.Adapter.extend({
	
	find: function(store, type, id) {
		var methodName = ('load ' + type.typeKey).camelize();
		return this.get('slyd.' + methodName).call(this.get('slyd'), id);
	},
	
	findAll: function(store, type) {
		var methodName = ('load ' + type.typeKey.pluralize()).camelize();
		return this.get('slyd.' + methodName).call(this.get('slyd'));
	},

	createRecord: function(store, type, record) {
		return this.updateRecord(store, type, record);
	},
	
	updateRecord: function(store, type, record) {
		var serializedRecord = store.serializerFor(type).serialize(record, { includeId: false });
		var methodName = ('save ' + type.typeKey).camelize();
		return this.get('slyd.' + methodName).call(this.get('slyd'), record.get('id'), serializedRecord);
	},
	
	deleteRecord: function(store, type, record) {
	},
});

ASTool.SpiderSerializer = DS.RESTSerializer.extend({

	extractSingle: function(store, type, payload, id, requestType) {
		payload = {spider: payload};
		var templates = payload.spider.templates;
		var templateIds = templates.mapProperty('id');
		payload.templates = templates;
		payload.spider.templates = templateIds;
		return this._super(store, type, payload, id, requestType);
  	},

	serializeHasMany: function(record, json, relationship) {
		var key = relationship.key;
		var relationshipType = DS.RelationshipChange.determineRelationshipType(record.constructor, relationship);

	    if (relationshipType === 'manyToNone' || 
		    relationshipType === 'manyToMany' ||
			relationshipType === 'manyToOne') {
			json[key] = record.get(key).map(function(relative) {
				return record.store.serializerFor(relationship.type).serialize(relative, { includeId: false });
			});
	    }
	}
});

ASTool.SpiderAdapter = ASTool.SlydAdapter.extend();


/*************************** Models **************************/

ASTool.Template = DS.Model.extend({
	page_id: DS.attr('string', {defaultValue:''}),
	scrapes: DS.attr('string', {defaultValue:'default'}),
	page_type: DS.attr('string', {defaultValue:'item'}),
	url: DS.attr('string', {defaultValue:''}),
	annotated_body: DS.attr('string', {defaultValue:''}),
	original_body: DS.attr('string', {defaultValue:''}),
	extractors: DS.attr(null, { defaultValue:[] }),
	name: function() {
		return this.get('url');
	}.property('url'),
}),

ASTool.Spider = DS.Model.extend({
	start_urls: DS.attr(null, { defaultValue:[] }),
	allowed_domains: DS.attr(null),
	links_to_follow: DS.attr('string', { defaultValue:'none' }),
	follow_patterns: DS.attr(null, { defaultValue:[] }),
	exclude_patterns: DS.attr(null),
	respect_nofollow: DS.attr('boolean', { defaultValue:true }),
	templates: DS.hasMany('template'),
	init_requests: DS.attr(null, { defaultValue:[] }),

	name: function() {
		return this.get('id');
	}.property('id'),

	performLogin: function(key, performLogin) {
		if (arguments.length > 1) {
			if (performLogin) {
				this.set('init_requests', [{type: 'login'}]);
			} else {
				this.get('init_requests').length = 0;
			}
		}
		return !!this.get('init_requests').length;
	}.property('init_requests'),

	loginUrl: function(key, loginUrl) {
		if (arguments.length > 1) {
			this.get('init_requests')[0]['loginurl'] = loginUrl;	
		}
		return this.get('init_requests')[0]['loginurl'];
	}.property('init_requests'),

	loginUser: function(key, loginUser) {
		if (arguments.length > 1) {
			this.get('init_requests')[0]['username'] = loginUser;	
		}
		return this.get('init_requests')[0]['username'];
	}.property('init_requests'),

	loginPassword: function(key, loginPassword) {
		if (arguments.length > 1) {
			this.get('init_requests')[0]['loginPassword'] = loginPassword;
		}
		return this.get('init_requests')[0]['loginPassword'];
	}.property('init_requests'),
}),

ASTool.Annotation = DS.Model.extend({	
	name: function() {
		if (this.get('annotations') && Object.keys(this.get('annotations')).length) {
			return JSON.stringify(this.get('annotations')).replace(/"/g, '');
		} else {
			return 'Empty (' + this.get('id').substring(0, 5) + ')';
		}
	}.property('annotations'),

	variant: DS.attr('string', { defaultValue: '0' }),
	
	annotations: DS.attr(),

	iframeBinding: 'ASTool.iframe',
	
	addMapping: function(attribute, itemField) {
		this.get('annotations')[attribute] = itemField;
		this.notifyPropertyChange('annotations');
	},
	
	removeMapping: function(attribute) {
		delete this.get('annotations')[attribute];
		this.notifyPropertyChange('annotations');
	},

	removeMappings: function() {
		this.set('annotations', {});
		this.notifyPropertyChange('annotations');
	},
	
	isPartial: false,
	
	_ignores: null,
	
	ignores: function() {
		if (this.get('_ignores') == null) {
			var ignoredElements = this.get('iframe').findIgnoredElements(this.get('id')).toArray();
			var ignores = ignoredElements.map(function(element) {
				var attributeName = $(element).attr('data-scrapy-ignore') ? 'data-scrapy-ignore' : 'data-scrapy-ignore-beneath';
				var name = $.parseJSON($(element).attr(attributeName))['name'];
				return ASTool.Ignore.create({element: element,
											 name: name,
											 ignoreBeneath: attributeName == 'data-scrapy-ignore-beneath'});
			});
			this.set('_ignores', ignores);
		} 
		return this.get('_ignores');
	}.property('_ignores'),

	addIgnore: function(element) {
		var ignore = ASTool.Ignore.create({element: element, name: 'unnamed ignored region'});
		this.get('ignores').pushObject(ignore);
	},

	removeIgnore: function(ignore) {
		this.get('ignores').removeObject(ignore);
	},

	removeIgnores: function() {
		this.get('_ignores').setObjects([]);
	},

	partialText: function() {
		if (this.get('element') && this.get('isPartial')) {
			return $(this.get('element')).text();
		} else {
			return '';
		}
	}.property('element'),
		
	selectedElement: null,
	
	element: function() {
		if (this.get('selectedElement')) {
			return this.get('selectedElement');
		} else {
			var annotatedElement = this.get('iframe').findAnnotatedElement(this.get('id'));
			if (annotatedElement.length) {
				return annotatedElement.get(0);
			} else {
				return null;
			}
		}
	}.property('selectedElement'),

	path: function() {
		if (this.get('element')) {
			return $(this.get('element')).getUniquePath();
		} else {
			return '';
		}
	}.property('element'),

	ancestorPaths: function() {
		if (!this.get('element')) {
			return [];
		}
		var path = this.get('path');
		var splitted = path.split('>');
		var result = [];
		var selector = '';
		splitted.forEach(function(pathElement, i) {
			var ancestorPath = {};
			selector += (selector ? '>' : '') + pathElement;
			ancestorPath['path'] = selector;
			var element = this.get('iframe').find(selector).get(0);
			ancestorPath['element'] = element;
			ancestorPath['label'] = element.tagName.toLowerCase();
			result.pushObject(ancestorPath);
		}.bind(this));
		return result;
	}.property('path'),

	childPaths: function() {
		if (!this.get('element')) {
			return [];
		}
		var result = [];
		if (this.get('element')) {
			var path = this.get('path');
			var children = this.get('element').children;
			children = Array.prototype.slice.call(children);
			children.forEach(function(child, i) {
				var childPath = {};
				childPath['label'] = child.tagName.toLowerCase();
				childPath['path'] = path + '>' + ':eq(' + i + ')';
				childPath['element'] = child;
				result.pushObject(childPath);
			});
		}
		return result;
	}.property('path'),
	
	attributes: function() {
		if (this.get('element')) {
			return $(this.get('element')).getAttributeList();
		} else {
			return [];
		}
	}.property('element'),
	
	unmappedAttributes: function() {
		unmapped = this.get('attributes').filter(
			function(attribute, index, self) {
				return !this.get('annotations')[attribute.get('name')];
			}.bind(this));
		return unmapped;
	}.property('attributes.@each', 'annotations'),
	
	mappedAttributes: function() {
		mapped = [];
		this.get('attributes').forEach(function(attribute) {
			if (this.get('annotations')[attribute.get('name')]) {
				attribute.set('mappedField', this.get('annotations')[attribute.get('name')]);
				mapped.addObject(attribute);
			}
		}.bind(this));
		return mapped;
	}.property('attributes.@each', 'annotations'),

	reload: function() {
		// Force reload of ignores from the document.
		this.set('_ignores', null);
		return this._super();
	}
});


ASTool.Item = Em.Object.extend({
	name: null,
	fields: null,
});


ASTool.ItemField = Em.Object.extend({
	name: null,
	type: 'text',
	required: false,
	vary: false,
});


ASTool.Attribute = Em.Object.extend({
	name: null,
	value: null,
	mappedField: null,
	annotation: null,
});


ASTool.Ignore = Em.Object.extend({
	name: null,
	element: null,
	ignoreBeneath: false,
	highlighted: false,
});
