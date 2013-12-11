/*************** Adapters & Serializers ****************/
ASTool.IFrameAdapter = DS.Adapter.extend({
	
	storageAttribute: null,

	iframeBinding: 'ASTool.iframe',
	
	generateIdForRecord: function(store, record) {
		return guid();
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
		return this._super(store, type, record);
	},

	updateRecord: function(store, type, record) {
		var oldIgnoredElements = this.get('iframe').findIgnoredElements(record.get('id'));
		oldIgnoredElements.removeAttr('data-scrapy-ignore');
		record.get('ignores').forEach(function(ignore) {
			var ignoreJSON = {id: record.get('id'), name: ignore.get('name')};
			$(ignore.get('element')).attr('data-scrapy-ignore', JSON.stringify(ignoreJSON));
		});
		return this._super(store, type, record);		
	},
});


ASTool.SlydApiAdapter = DS.Adapter.extend({
	
	find: function(store, type, id) {
		var methodName = ('load ' + type.typeKey).camelize();
		return ASTool.api.get(methodName).call(ASTool.api, id);
	},
	
	findAll: function(store, type) {
		var methodName = ('load ' + type.typeKey.pluralize()).camelize();
		return ASTool.api.get(methodName).call(ASTool.api);
	},

	createRecord: function(store, type, record) {
		return this.updateRecord(store, type, record);
	},
	
	updateRecord: function(store, type, record) {
		var serializedRecord = store.serializerFor(type).serialize(record, { includeId: false });
		var methodName = ('save ' + type.typeKey).camelize();
		return ASTool.api.get(methodName).call(ASTool.api, record.get('id'), serializedRecord);
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

ASTool.SpiderAdapter = ASTool.SlydApiAdapter.extend();


/*************************** Models **************************/

ASTool.Template = DS.Model.extend({
	page_id: DS.attr('string', {defaultValue:''}),
	scrapes: DS.attr('string', {defaultValue:'default'}),
	page_type: DS.attr('string', {defaultValue:'item'}),
	url: DS.attr('string', {defaultValue:''}),
	annotated_body: DS.attr('string', {defaultValue:''}),
	original_body: DS.attr('string', {defaultValue:''}),
	extractors: DS.attr(null, {defaultValue:[]}),
	name: function() {
		return this.get('url');
	}.property('url'),
}),

ASTool.Spider = DS.Model.extend({
	start_urls: DS.attr(null, {defaultValue:[]}),
	allowed_domains: DS.attr(null),
	links_to_follow: DS.attr('string', {defaultValue:'none'}),
	follow_patterns: DS.attr(null),
	exclude_patterns: DS.attr(null),
	respect_nofollow: DS.attr('boolean', {defaultValue:true}),
	templates: DS.hasMany('template'),
	init_requests: DS.attr(null),
	name: function() {
		return this.get('id');
	}.property('id'),
}),

ASTool.Annotation = DS.Model.extend({	
	name: DS.attr('string'),
	
	annotations: DS.attr(),

	iframeBinding: 'ASTool.iframe',

	//FIXME
	annotationsChanged: false,
	
	addMapping: function(attribute, itemField) {
		this.get('annotations')[attribute] = itemField;
		//FIXME
		this.set('annotationsChanged', !this.annotationsChanged);
	},
	
	removeMapping: function(attribute) {
		delete this.get('annotations')[attribute];
		//FIXME
		this.set('annotationsChanged', !this.annotationsChanged);
	},

	removeMappings: function() {
		this.set('annotations', {});
		//FIXME
		this.set('annotationsChanged', !this.annotationsChanged);
	},
	
	isPartial: false,
	
	_ignores: null,
	
	ignores: function() {
		if (this.get('_ignores') == null) {
			var ignoredElements = this.get('iframe').findIgnoredElements(this.get('id')).toArray();
			var ignores = ignoredElements.map(function(element){
				var name = $.parseJSON($(element).attr('data-scrapy-ignore'))['name'];
				return ASTool.Ignore.create({element: element, name: name});
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
			return [];
		}
	}.property('element'),
	
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
	}.property('attributes.@each', 'annotationsChanged'),
	
	mappedAttributes: function() {
		mapped = [];
		this.get('attributes').forEach(function(attribute) {
			if (this.get('annotations')[attribute.get('name')]) {
				attribute.set('mappedField', this.get('annotations')[attribute.get('name')]);
				mapped.addObject(attribute);
			}
		}.bind(this));
		return mapped;
	}.property('attributes.@each', 'annotationsChanged'),

	reload: function() {
		// Force reload of ignores from the document.
		this.set('_ignores', null);
		return this._super();
	}
});


ASTool.Item = Em.Object.extend({
	name: null,
	fields: [],
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
	highlighted: false,
});


function s4() {
	return Math.floor((1 + Math.random()) * 0x10000)
		.toString(16)
		.substring(1);
};

function guid() {
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
}