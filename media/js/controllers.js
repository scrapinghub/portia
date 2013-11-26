ASTool.AnnotationsController = Em.ArrayController.extend({
	
	needs: ['application', 'page'],
	
	documentViewBinding: 'controllers.application.documentView',

	currentlySelectedElement: null,

	sprites: [],
	
	currentPageBinding: 'controllers.page.currentUrl',
	
	sprites: function() {
		return this.get('content').map(function(annotation) {
			if (annotation.get('element')) {
				return ASTool.AnnotationSprite.create({'annotation': annotation});
			} else {
				return null;
			}
		}).filter(function(annotation) {return annotation});
	}.property('content.@each.element'),
		
	addAnnotation: function() {
		var annotation = this.store.createRecord('annotation');
		annotation.set('name', 'Annotation ' + annotation.get('id').substring(0, 5));
		annotation.save().then(function() {
			this.editAnnotation(annotation);
		}.bind(this));
	},
	
	editAnnotation: function(annotation) {
		this.transitionToRoute('annotation', annotation);
	},
	
	deleteAllAnnotations: function() {
		var annotations = this.get('content').toArray();
		annotations.invoke('deleteRecord');
		annotations.invoke('save');
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
		},
	},

	willEnter: function() {
		this.set('documentView.dataSource', this);
		this.set('documentView.elementSelectionEnabled', false);
	},

	willLeave: function() {
		this.set('documentView.dataSource', null);
	},
});


ASTool.AnnotationController = Em.ObjectController.extend({

	needs: ['application', 'annotations'],
	
	mappingAttribute: null,
	
	documentViewBinding: 'controllers.application.documentView',

	currentlySelectedElement: null,
	
	selectingIgnore: false,

	sprites: function() {
		var sprites = [];
		if (this.get('currentlySelectedElement')) {
			sprites.pushObject(ASTool.AnnotationSprite.create(
				{'annotation': this.content,
				 'dashed': true}));
		}

		var annotationSprites = this.get('controllers.annotations.sprites').filter(function(sprite) {
			return sprite.get('annotation.id') != this.content.get('id');
		}.bind(this));

		var ignoredElements = this.get('model.ignores').map(function(ignore) {
			return ASTool.ElementSprite.create({'element': ignore.get('element'),
												'text': ignore.get('name'),
												'fillColor': 'rgba(255, 0, 0, 0.2)',
												'strokeColor': 'rgba(255, 0, 0, 0.7)'})
		});

		return sprites.concat(annotationSprites).concat(ignoredElements);
	}.property('currentlySelectedElement',
			   'controllers.annotations.sprites',
			   'model.ignores.@each'),
	
	clearSelection: function() {
		if (this.get('isPartial')) {
			var insElement = this.get('currentlySelectedElement');
			$(insElement).removePartialAnnotation();
		}
	},
	
	cancelEdit: function(annotation) {
		this.get('documentView').elementSelectionEnabled(false);
		annotation.set('selectedElement', null);
		if (!annotation.get('element')) {
			annotation.deleteRecord();	
		}
		this.transitionToRoute('annotations');
	},
	
	actions: {
		
		doneEditing: function(annotation) {
			annotation.save().then(function() {
				this.transitionToRoute('annotations');
				annotation.set('selectedElement', null);
			}.bind(this));
		},
		
		cancelEdit: function(annotation) {
			this.cancelEdit(annotation);
		},
		
		mapAttribute: function(attribute) {
			attribute.set('annotation', this.get('model'));
			this.set('mappingAttribute', attribute);
			this.transitionToRoute('items');
		},
		
		addIgnore: function() {
			this.set('documentView.restrictToDescendants', this.get('element'));
			this.set('documentView.partialSelectionEnabled', false);
			this.set('selectingIgnore', true);
		},

		deleteIgnore: function(ignore) {
			var ignores = this.get('ignores');
			ignores.removeObject(ignore);
		},	
	},

	confirmChangeSelection: function() {
		return confirm('If you select a different region you will lose all the ignored regions and attribute mappings you defined, proceed anyway?');
	},
	
	documentActions: {
		
		elementSelected: function(element) {
			if (this.get('selectingIgnore')) {
				if (element) {
					this.content.addIgnore(element);	
				}
				this.set('selectingIgnore', false);
				this.set('documentView.restrictToDescendants', false);
			} else {
				var needsConfirmation = this.get('ignores').length || this.get('mappedAttributes').length;
				if (!needsConfirmation || this.confirmChangeSelection()) {
					this.clearSelection();
					this.content.set('selectedElement', element);
					this.content.set('isPartial', false);
					this.content.removeIgnores();
					this.set('currentlySelectedElement', element);
				}
			}
			this.set('documentView.partialSelectionEnabled', true);
		},
		
		partialSelection: function(selection) {
			var needsConfirmation = this.get('ignores').length || this.get('mappedAttributes').length;
			if (!needsConfirmation || this.confirmChangeSelection()) {
				this.clearSelection();
				var element = $('<ins/>').get(0);
				selection.getRangeAt(0).surroundContents(element);
				this.content.set('selectedElement', element);
				this.content.set('isPartial', true);
				this.content.removeIgnores();
				this.set('currentlySelectedElement', element);
			}
			selection.collapse();
		},
	},

	willEnter: function() {
		this.set('documentView.listener', this);
		this.set('documentView.elementSelectionEnabled', true);
		this.set('documentView.partialSelectionEnabled', true);
		this.set('documentView.dataSource', this);
		this.set('currentlySelectedElement', this.get('element'));
	},

	willLeave: function() {
		this.set('selectingIgnore', false);
		this.set('documentView.listener', null);
		this.set('documentView.elementSelectionEnabled', false);
		this.set('documentView.partialSelectionEnabled', false);
		this.set('documentView.dataSource', null);
	},
});


ASTool.ItemsController = Em.ArrayController.extend({
	
	needs: ['annotation'],
	
	mappingAttributeBinding: 'controllers.annotation.mappingAttribute',

	addItem: function() {
		var newItem = this.store.createRecord('item', {});
		newItem.save();
	},
	
	addField: function(owner) {
		var field = this.store.createRecord('item-field',
			{type:'string', item: owner});
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
			var attribute = this.get('mappingAttribute');
			var annotation = attribute.get('annotation');
			annotation.addMapping(attribute.get('name'), field.get('item').get('name') + '.' + field.get('name'));
			this.transitionToRoute('annotation', annotation);
			this.set('mappingAttribute', null);	   
		}
	},
});


ASTool.PageController = Em.Controller.extend({
	needs: ['annotations', 'application'],
	
	navigateToUrl: 'http://dmoz.org',
	
	currentUrl: null,
	
	actions: {
		loadPage: function() {
			this.set('currentUrl', null);
			this.get('controllers.annotations').deleteAllAnnotations();
			this.get('controllers.application.documentView').loadAnnotatedDocument(this.get('navigateToUrl'), 
				function(docIframe){
					ASTool.IFrameAdapter.reopen({
						iframe: docIframe,
					}),
					this.set('currentUrl', this.get('navigateToUrl'));
					this.transitionToRoute('annotations');
				}.bind(this)
			);
		},
	},
});


ASTool.ApplicationController = Em.Controller.extend({
	
	needs: ['page'],
	
	documentView: null,
	
	actions: {
		gotoAnnotations: function() {
			this.transitionToRoute('annotations');
		},
		
		gotoPageSelection: function() {
			this.transitionToRoute('page');
		},
		
		gotoItems: function() {
			this.transitionToRoute('items');
		},
	}
});
