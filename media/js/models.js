ASTool.IFrameAdapter = DS.Adapter.extend({
	
	storageAttribute: null,
	
	generateIdForRecord: function(store, record) {
		return guid();
	},
	
	find: function(store, type, id) {
		var annotatedElement = findAnnotatedElement(id);
		var annotationJSON = $.parseJSON($(element).attr(this.get('storageAttribute')));
		return annotationJSON;
	},
	
	findAll: function(store, type) {
		var annotatedElements = findAnnotatedElements();
		var annotationsJSON = [];
		$.each(annotatedElements, function(i, element) {
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
		var oldAnnotatedElement = findAnnotatedElement(record.get('id'));
		oldAnnotatedElement.removeAttr(this.get('storageAttribute'));
		$(record.get('element')).attr(this.get('storageAttribute'), JSON.stringify(serializedRecord));
		return this.wrapInPromise(function() {
			return serializedRecord;
		}, this);
	},
	
	deleteRecord: function(store, type, record) {
		if (record.get('isPartial')) {
			removePartialAnnotation(record.get('element'));
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

ASTool.AnnotationAdapter = ASTool.IFrameAdapter.extend({storageAttribute: 'data-scrapy-annotate'});


/*************************** Models **************************/

ASTool.Annotation = DS.Model.extend({	
	name: DS.attr('string'),
	
	annotations: DS.attr('string'),
	
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
			var annotatedElement = findAnnotatedElement(this.get('id'));
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
			return getAttributeList(this.get('element'));
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

/*************************** Helper objects *******************/ 

ASTool.Attribute = Em.Object.extend({
	name: null,
	value: null,
	mappedField: null,
	annotation: null,
});