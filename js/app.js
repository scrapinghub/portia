/*************************** Application **************************/ 

ASTool = Em.Application.create({ 
    ready: function(){ 
    } 
});

ASTool.ApplicationAdapter = DS.RESTAdapter.extend({
  host: 'http://localhost:9001',
});

/*************************** Models **************************/ 

ASTool.Item = DS.Model.extend({ 
	name: DS.attr('string'), 
	fields: DS.hasMany('item-field'),
});

ASTool.ItemField = DS.Model.extend({ 
	name: DS.attr('string'),
	item: DS.belongsTo('item'),
});

ASTool.Annotation = DS.Model.extend({ 
	name: DS.attr('string'), 
	path: DS.attr('string'),
	attributes: [],
	fieldMappings: DS.hasMany('field-mapping'),
	
	unmappedAttributes: function() {
		unmapped = this.get('attributes').filter(
			function(attribute, index, self) {
				return !this.get('fieldMappings').anyBy('attribute', attribute.name)
			}.bind(this));
		return unmapped;
	}.property('attributes', 'fieldMappings'),
	
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

ASTool.FieldMapping = DS.Model.extend({
	itemField: DS.belongsTo('item-field'),
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
	
	bindAnnotations: function() {
		this.store.find('annotation').then(function(annotations) {
			_annotations = annotations;
			redrawCanvas();
		});
	},

	addAnnotation: function() {
		var annotation = this.store.createRecord('annotation', {});
		var me = this;
        annotation.save().then(function(annotation) {
        	me.editAnnotation(annotation);
        }, function(error) {
        	console.log('Error saving annotation: ' + error);
        });
	},
	
	editAnnotation: function(annotation) {
		this.transitionToRoute('annotation', annotation);
	},

	actions: {
		
		editAnnotation: function(annotation) {
			this.editAnnotation(annotation);
		},

		addAnnotation: function() {
			this.addAnnotation();
		},
		
		deleteAnnotation: function(annotation) {
		   annotation.deleteRecord();
		   annotation.save();
		   redrawCanvas();
	   },
     }
});

ASTool.AnnotationController = Em.ObjectController.extend({
	mappingAttribute: null,
	
	actions: {

		doneEditing: function(annotation) {
			uninstallEventHandlers();
			annotation.save();
			this.transitionToRoute('annotations');
	  	},
		
		mapAttribute: function(attribute) {
			attribute.set('annotation', this.get('model'));
			this.set('mappingAttribute', attribute);
			this.transitionToRoute('items');
		}
  }
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
		   mapping = this.store.createRecord('field-mapping',
										     {itemField:field,
											  attribute:attribute.get('name')});
    	   mapping.save().then(
				function(fieldMapping) {
					var annotation = attribute.get('annotation');
					annotation.get('fieldMappings').addObject(fieldMapping);
					annotation.save();
					this.transitionToRoute('annotation', annotation);
				}.bind(this));
	   }
     }
});
/*************************** Routers **************************/ 

ASTool.Router.map(function() {
	this.resource('annotations', {path: '/'});
	this.resource('annotations');
	this.resource('annotation', {path: '/annotation/:annotation_id'});
	this.resource('items');
	this.resource('item', {path: '/item/:item_id'});
});

/*************************** Routes **************************/ 

ASTool.AnnotationsRoute = Ember.Route.extend({
	model: function() {
		return this.store.find('annotation');
		//return this.get('store').findAll('annotation');
	    //return annotations;
    },
	
	afterModel: function() {
		this.controllerFor('annotations').bindAnnotations();
	}
});

ASTool.AnnotationRoute = Ember.Route.extend({
	model: function(params) {
		return this.get('store').find('annotation', params.annotation_id);
	},
  
	afterModel: function(model) {
		var path = model.get('path');
		selection = path;
		installEventHandlers(model);
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

/*************************** Helpers ******************************/
Ember.Handlebars.helper('trim', function(text) {
	var maxLength = 400;
	if (text.length > 400) {
 		return text.substring(0, 400) + "...";
	} else {
		return text;
	}
});
