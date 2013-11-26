ASTool.IFrameAdapter = DS.Adapter.extend({
	
	storageAttribute: null,
	
	generateIdForRecord: function(store, record) {
		return guid();
	},
	
	find: function(store, type, id) {
		var annotatedElement = this.iframe.findAnnotatedElement(id);
		var annotationJSON = $.parseJSON($(element).attr(this.get('storageAttribute')));
		return annotationJSON;
	},
	
	findAll: function(store, type) {
		var annotatedElements = this.iframe.findAnnotatedElements();
		var annotationsJSON = [];
		$.each(annotatedElements, function(i, element) {
			annotationsJSON.pushObject($.parseJSON($(element).attr(this.get('storageAttribute'))));
		}.bind(this));
		return annotationsJSON;
	},
	
	createRecord: function(store, type, record) {
		record.set('iframe', this.iframe);
		serializedRecord = store.serializerFor(type).serialize(record, { includeId: true });
		$(record.get('element')).attr(this.get('storageAttribute'), JSON.stringify(serializedRecord));
		return this.wrapInPromise(function() {
			return serializedRecord;
		}, this);
	},
	
	updateRecord: function(store, type, record) {
		serializedRecord = store.serializerFor(type).serialize(record, { includeId: true });
		var oldAnnotatedElement = this.iframe.findAnnotatedElement(record.get('id'));
		oldAnnotatedElement.removeAttr(this.get('storageAttribute'));
		$(record.get('element')).attr(this.get('storageAttribute'), JSON.stringify(serializedRecord));
		return this.wrapInPromise(function() {
			return serializedRecord;
		}, this);
	},
	
	deleteRecord: function(store, type, record) {
		if (record.get('isPartial')) {
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
		var ignoredElements = this.iframe.findIgnoredElements(record.get('id'));
		ignoredElements.removeAttr('data-scrapy-ignore');
		return this._super(store, type, record);
	},

	updateRecord: function(store, type, record) {
		var oldIgnoredElements = this.iframe.findIgnoredElements(record.get('id'));
		oldIgnoredElements.removeAttr('data-scrapy-ignore');
		record.get('ignores').forEach(function(ignore) {
			var ignoreJSON = {id: record.get('id'), name: ignore.get('name')};
			$(ignore.get('element')).attr('data-scrapy-ignore', JSON.stringify(ignoreJSON));
		});
		return this._super(store, type, record);		
	},
});

/*************************** Models **************************/

ASTool.Annotation = DS.Model.extend({	
	name: DS.attr('string'),
	
	annotations: DS.attr('string'),

	iframe: null,
	
	fieldMappings: function() {
		if (this.get('annotations')) {
			return $.parseJSON(this.get('annotations'));
		} else {
			return {};
		}
	}.property('annotations'),
	
	addMapping: function(attribute, itemField) {
		var mappings = this.get('fieldMappings');
		mappings[attribute] = itemField;
		this.set('annotations', JSON.stringify(mappings));
	},
	
	removeMapping: function(attribute, itemField) {
		var mappings = this.get('fieldMappings');
		delete mappings[attribute];
		this.set('annotations', JSON.stringify(mappings));
	},
	
	isPartial: false,
	
	_ignores: null,
	
	ignores: function() {
		if (this.get('_ignores') == null) {
			var ignoredElements = this.iframe.findIgnoredElements(this.get('id')).toArray();
			var ignores = ignoredElements.map(function(element){
				var name = $.parseJSON($(element).attr('data-scrapy-ignore'))['name'];
				return ASTool.Ignore.create({element: element, name: name});
			});
			this.set('_ignores', ignores);
		} 
		return this.get('_ignores');
	}.property('_ignores'),

	addIgnore: function(element) {
		var ignore = ASTool.Ignore.create({element: element, name: 'testname'});
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
			var annotatedElement = this.iframe.findAnnotatedElement(this.get('id'));
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
				return !this.get('fieldMappings')[attribute.get('name')];
			}.bind(this));
		return unmapped;
	}.property('attributes.@each', 'annotations'),
	
	mappedAttributes: function() {
		mapped = [];
		this.get('attributes').forEach(function(attribute) {
			if (this.get('fieldMappings')[attribute.get('name')]) {
				attribute.set('mappedField', this.get('fieldMappings')[attribute.get('name')]);
				mapped.addObject(attribute);
			}
		}.bind(this));
		return mapped;
	}.property('attributes', 'fieldMappings'),
});

ASTool.Item = DS.Model.extend({ 
	name: DS.attr('string'), 
	fields: DS.hasMany('item-field'),
});

ASTool.ItemField = DS.Model.extend({ 
	name: DS.attr('string'),
	type: DS.attr('string'),
	required: DS.attr('boolean'),
	vary: DS.attr('boolean'),
	item: DS.belongsTo('item'),
});

ASTool.FieldMapping = DS.Model.extend({
	itemField: DS.attr('string'),
	attribute: DS.attr('string'),
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