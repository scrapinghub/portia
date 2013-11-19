ASTool.AnnotationsController = Em.ArrayController.extend({
	
	needs: ['application', 'page'],
	
	documentViewBinding: 'controllers.application.documentView',
	
	currentlySelectedElement: null,
	
	currentPageBinding: 'controllers.page.currentUrl',
	
	highlightedElements: function() {
		return this.get('content').map(function(annotation) {
			return annotation.get('element');
		});
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
		var promises = [];
		var annotations = this.toArray();
		annotations.invoke('deleteRecord');
		annotations.invoke('save');
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
			var insElement = this.get('currentlySelectedElement');
			removePartialAnnotation(insElement);
		}
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
	
	currentPathWillChange: function(){
		console.log('>>>>>' + this.get('controllers.application.currentPath'));
		/*if (this.get('controllers.application.currentPath') == 'annotation' &&
			this.get('content.isDirty')) {
			this.cancelEdit(this.content);
		}*/
		
	}.observes('application.currentPath'),
	
	
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
			this.cancelEdit(annotation);
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
			var insElement = $('<ins/>').get(0);
			selection.getRangeAt(0).surroundContents(insElement);
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
			{type:'string',
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
			annotation.addMapping(attribute.get('name'), field.get('item').get('name') + '.' + field.get('name'));
			this.transitionToRoute('annotation', annotation);		   
		}
	},
});


ASTool.PageController = Em.Controller.extend({
	needs: ['annotations', 'application'],
	
	navigateToUrl: 'http://dmoz.org',
	
	currentUrl: null,
	
	actions: {
		loadPage: function() {
			this.set('currentUrl', this.get('navigateToUrl'));
			this.get('controllers.annotations').deleteAllAnnotations();
			loadAnnotatedDocument(this.get('navigateToUrl'), 
				function(){
					this.transitionToRoute('annotations');
				}.bind(this),
				this.get('controllers.application')
			);
		},
	},
});


ASTool.DocumentView = Em.Object.extend({
	selectionsSource: null,
	
	currentlySelectedElementBinding: 'selectionsSource.currentlySelectedElement',
	
	highlightedElementsBinding: 'selectionsSource.highlightedElements',
	
	elementSelectionEnabled: function(selectionEnabled) {
		if (iframe) {
			if (selectionEnabled) {
				showHoveredInfo();
				installEventHandlers();
			} else {
				uninstallEventHandlers();
				hideHoveredInfo();
			}
		}
	},
	
	redrawNow: function() {
		if (iframe) {
			redrawCanvas();
		}
	}.observes('currentlySelectedElement', 'highlightedElements'),
	
	resetSelections: function() {
		this.set('selectionSource', null);
	}
}),

ASTool.ApplicationController = Em.Controller.extend({
	
	documentView: ASTool.DocumentView.create(),
	
	currentPathWillChange: function() {
		console.log('>>>>>' + this.get('currentPath'));
	}.observes('currentPath'),
	
	documentListener: null,
	
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
