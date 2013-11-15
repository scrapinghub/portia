/*************************** Application **************************/ 

ASTool = Em.Application.create({
	ready: function(){
	} 
});

ASTool.Router.reopen({
	location: 'none'
});

ASTool.ApplicationAdapter = DS.RESTAdapter.extend({
	host: 'http://localhost:9001',
});

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
		$(record.get('element')).removeAttr(this.get('storageAttribute'));
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

//FIXME: Fix the serialization of field mappings.
/*
ASTool.AnnotationSerializer = DS.JSONSerializer.extend({
    serialize: function(record, options) {
       var json = this._super.apply(this, arguments);
	   var fieldMappings = record.get('fieldMappings');
	   var fieldMappingsJson = {};
	   fieldMappings.forEach(function(fieldMapping) {
		   fieldMappingsJson[fieldMapping.get('attribute')] = fieldMapping.get('itemField');
	   });
	   json['fieldMappings'] = fieldMappingsJson;
       return json;
   },
	 
	extractSingle: function(store, type, payload, id, requestType) {
		return this._super.apply(this, arguments);
	},
	
 });*/


ASTool.AnnotationAdapter = ASTool.IFrameAdapter.extend({storageAttribute: 'data-scrapy-annotate'});


/*************************** Models **************************/

ASTool.Annotation = DS.Model.extend({	
	name: DS.attr('string'),
	
	//fieldMappings: DS.hasMany('field-mapping'),
	
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
				return attribute.mappedItem == null && attribute.mappedField == null;
			}.bind(this));
		return unmapped;
	}.property('attributes.@each'),
	
	mappedAttributes: function() {
		mapped = [];
		this.get('attributes').forEach(function(attribute) {
			this.get('fieldMappings').forEach(function(mapping) {
				if (mapping.get('attribute') == attribute.get('name')) {
					attribute.set('mappedField', mapping.get('itemField').get('name'));
					attribute.set('mappedItem',mapping.get('itemField').get('item').get('name'));
					mapped.addObject(attribute);
				}
			}.bind(this));
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
	mappedItem: null,
	mappedField: null,
	annotation: null,
});

/*************************** Controllers **************************/

ASTool.AnnotationsController = Em.ArrayController.extend({
	
	needs: ['application'],
	
	documentViewBinding: 'controllers.application.documentView',
	
	currentlySelectedElement: null,
	
	highlightedElements: function() {
		return this.get('content').map(function(annotation) {
			return annotation.get('element');
		});
	}.property('content.@each.element'),
		
	addAnnotation: function() {
		var annotation = this.store.createRecord('annotation');
		annotation.set('name', 'Annotation ' + annotation.get('id').substring(0, 5));
		this.editAnnotation(annotation);
	},
	
	editAnnotation: function(annotation) {
		this.transitionToRoute('annotation', annotation);
	},

	actions: {
		
		editAnnotation: function(annotation) {
			annotation.set('selectedElement', null);
			this.editAnnotation(annotation);
		},

		addAnnotation: function() {
			this.addAnnotation();
		},
		
		deleteAnnotation: function(annotation) {
			annotation.deleteRecord();
			annotation.save();
		},
	}
});

ASTool.AnnotationController = Em.ObjectController.extend({
	mappingAttribute: null,
	
	needs: ['application', 'annotations'],
	
	documentViewBinding: 'controllers.application.documentView',
	
	highlightedElements: function() {
		var highlightedElementsWithoutSelection = this.get('controllers.annotations.highlightedElements').copy().removeObject(this.get('currentlySelectedElement'));
		return highlightedElementsWithoutSelection;
	}.property('controllers.annotations.highlightedElements'),
	
	currentlySelectedElement: null,
	
	clearSelection: function() {
		if (this.get('content').get('isPartial')) {
			// FIXME: this fragments the text node of the element.
			$(this.get('currentlySelectedElement')).replaceWith($(this.get('currentlySelectedElement')).contents());
		}
	},
	
	actions: {
		
		doneEditing: function(annotation) {
			this.get('documentView').elementSelectionEnabled(false);
			annotation.save().then(function() {
				this.transitionToRoute('annotations');
				annotation.set('selectedElement', null);
				this.get('documentView').resetSelections();
			}.bind(this));
		},
		
		cancelEdit: function(annotation) {
			this.get('documentView').elementSelectionEnabled(false);
			annotation.set('selectedElement', null);
			if (!annotation.get('element')) {
				annotation.deleteRecord();	
			}
			this.transitionToRoute('annotations');
			this.get('documentView').resetSelections();
		},
		
		mapAttribute: function(attribute) {
			this.get('documentView').elementSelectionEnabled(false);
			attribute.set('annotation', this.get('model'));
			this.set('mappingAttribute', attribute);
			this.transitionToRoute('items');
		},
	},
	
	documentActions: {
		
		elementSelected: function(element) {
			this.clearSelection();
			this.content.set('selectedElement', element);
			this.content.set('isPartial', false);
			this.set('currentlySelectedElement', element);
		},
		
		partialSelection: function(selection) {
			this.clearSelection();
			var insElement = $('<ins/>');
			selection.getRangeAt(0).surroundContents(insElement.get(0));
			this.content.set('isPartial', true);
			this.set('currentlySelectedElement', insElement);
			this.content.set('selectedElement', insElement);
			selection.collapse();
		}
	},
});

ASTool.ItemsController = Em.ArrayController.extend({
	
	mappingAttribute: null,
	
	addItem: function() {
		var newItem = this.store.createRecord('item', {});
		newItem.save();
	},
	
	addField: function(owner) {
		var field = this.store.createRecord('item-field',
			{name:'unnamed field',
			type:'string',
			item: owner});
		field.save().then(function() {
			owner.get('fields').addObject(field);
			owner.save().then(function() {},
				function(error) {
					console.log('Error saving item: ' + error);
				})
			});
	},

	actions: {
		
		addItem: function() {
			this.addItem();
		},
		
		addField: function(item) {
			this.addField(item);
		},
		
		deleteItem: function(item) {
			item.deleteRecord();
			item.save();
		},
	   
		chooseField: function(field) {
			attribute = this.get('mappingAttribute');
			annotation = attribute.get('annotation');
			var fieldMapping = this.store.createRecord('field-mapping',
				{itemField: field.get('item').get('name') + '.' + field.get('name'),
				attribute: attribute.get('name')});
			annotation.get('fieldMappings').pushObject(fieldMapping);
			this.transitionToRoute('annotation', annotation);		   
		}
	},
});


ASTool.DocumentView = Em.Object.extend({
	selectionsSource: null,
	
	currentlySelectedElementBinding: 'selectionsSource.currentlySelectedElement',
	
	highlightedElementsBinding: 'selectionsSource.highlightedElements',
	
	elementSelectionEnabled: function(selectionEnabled) {
		if (selectionEnabled) {
			installEventHandlers();
		} else {
			uninstallEventHandlers();
		}
	},
	
	redrawNow: function() {
		redrawCanvas()
	}.observes('currentlySelectedElement', 'highlightedElements'),
	
	resetSelections: function() {
		this.set('selectionSource', null);
	}
}),

ASTool.ApplicationController = Em.Controller.extend({
	documentView: ASTool.DocumentView.create(),
	documentListener: null,
});


/*************************** Routers **************************/ 

ASTool.Router.map(function() {
	this.resource('annotations');
	this.resource('annotation', {path: '/annotation/:annotation_id'});
	this.resource('items');
	this.resource('item', {path: '/item/:item_id'});
});

/*************************** Routes **************************/ 

ASTool.ApplicationRoute = Em.Route.extend({
});

ASTool.AnnotationsRoute = Ember.Route.extend({
	model: function() {
		return this.store.find('annotation');
	},
	
	setupController: function(controller, model) {
		controller.set('model', model);
		controller.get('documentView').elementSelectionEnabled(false);
		controller.get('documentView').set('selectionsSource', controller);
	},
	
});

ASTool.AnnotationRoute = Ember.Route.extend({
	model: function(params) {
		return ASTool.annotationsStore.find(params.annotation_id);
	},
	
	setupController: function(controller, model) {
		controller.set('model', model);
		controller.get('controllers.application').set('documentListener', controller);
		controller.get('documentView').elementSelectionEnabled(true);
		controller.get('documentView').set('selectionsSource', controller);
		controller.set('currentlySelectedElement', model.get('element'));
	},
});

ASTool.ItemsRoute = Ember.Route.extend({
	beforeModel: function() {		
		var mappingAttribute = this.controllerFor('annotation').get('mappingAttribute');
		if (mappingAttribute) {
			this.controllerFor('items').set('mappingAttribute', mappingAttribute);
		}
	},
	
	model: function() {
		return this.store.find('item');
	}
});

/*************************** Components **************************/

ASTool.MyButtonComponent = Ember.Component.extend({
	click: function() {
		this.sendAction();
	}
});

/*************************** Views ********************************/

ASTool.ElemAttributeView = Ember.View.extend({
	templateName: 'elem-attribute',
	name: null,
	value: null,
});

ASTool.ItemView = Ember.View.extend({
	templateName: 'item',
	item: null,
	mappingAttribute: null,
});

ASTool.EditField = Ember.TextField.extend({
	owner: null,
	change: function(evt) {
		this.get('owner').save();
	}
});

ASTool.EditBox = Ember.Checkbox.extend({
	owner: null,
	change: function(evt) {
		this.get('owner').save();
	}
});

ASTool.TypeSelect = Ember.Select.extend({
	owner: null,
	content: ['geopoint', 'image', 'number', 'price', 'raw html', 'safe html', 'text'],
	change: function(evt) {
		this.get('owner').save();
	}
});

ASTool.AnnotatedDocumentView = Ember.View.extend({
	templateName: 'annotated-document-view',
	
	didInsertElement: function() {
		loadAnnotatedDocument(function(){
			this.get('controller').transitionToRoute('annotations');
		}.bind(this), this.get('controller'));
	},
});


/*************************** Helpers ******************************/
Ember.Handlebars.helper('trim', function(text) {
	var maxLength = 400;
	if (text.length > 400) {
		return text.substring(0, 400) + "...";
	} else {
		return text;
	}
});
