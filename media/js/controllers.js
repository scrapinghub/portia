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
	
	selectingIgnore: false,
	
	highlightedElements: function() {
		var highlightedElementsWithoutSelection = this.get('controllers.annotations.highlightedElements').copy().removeObject(this.get('currentlySelectedElement'));
		return highlightedElementsWithoutSelection;
	}.property('controllers.annotations.highlightedElements', 'currentlySelectedElement'),
	
	currentlySelectedElement: null,
	
	ignoredElements: function() {
		return this.get('model.ignores').map(function(ignore) {
			return ignore.get('element');
		});
	}.property('model.ignores.@each'),
	
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
		
		addIgnore: function() {
			this.set('documentView.restrictToDescendants', true);
			this.set('selectingIgnore', true);
		},

		deleteIgnore: function(ignore) {
			var ignores = this.get('model.ignores');
			ignores.removeObject(ignore);
		},	
	},
	
	documentActions: {
		
		elementSelected: function(element) {
			if (this.get('selectingIgnore')) {
				this.content.addIgnore(element);
				this.set('selectingIgnore', false);
				this.set('documentView.restrictToDescendants', false);
			} else {
				var needsConfirmation = this.get('ignoredElements').length || this.get('model.mappedAttributes').length;
				if (!needsConfirmation ||
					confirm('If you select a different region you will lose all the ignored regions and attribute mappings you defined, proceed anyway?')) {
					this.clearSelection();
					this.content.set('selectedElement', element);
					this.content.set('isPartial', false);
					this.content.removeIgnores();
					this.set('currentlySelectedElement', element);	
				}
			}
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

	willLeave: function() {
		console.log('Leaving controller...');
	},
});

ASTool.ItemsController = Em.ArrayController.extend({
	
	needs: ['annotation'],
	
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
			attribute = this.get('controllers.annotations.mappingAttribute');
			annotation = attribute.get('annotation');
			annotation.addMapping(attribute.get('name'), field.get('item').get('name') + '.' + field.get('name'));
			this.transitionToRoute('annotation', annotation);
			this.set('controllers.annotations.mappingAttribute', null);	   
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
			loadAnnotatedDocument(this.get('navigateToUrl'), 
				function(){
					this.set('currentUrl', this.get('navigateToUrl'));
					this.transitionToRoute('annotations');
				}.bind(this),
				this.get('controllers.application')
			);
		},
	},
});


ASTool.DocumentView = Em.Object.extend({
	selectionsSource: null,
	
	restrictToDescendants: false,
	
	currentlySelectedElementBinding: 'selectionsSource.currentlySelectedElement',
	
	highlightedElementsBinding: 'selectionsSource.highlightedElements',
	
	ignoredElementsBinding: 'selectionsSource.ignoredElements',
	
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
	}.observes('currentlySelectedElement', 'highlightedElements.@each', 'ignoredElements.@each'),
	
	resetSelections: function() {
		this.set('selectionSource', null);
	}
}),

ASTool.ApplicationController = Em.Controller.extend({
	
	needs: ['page'],
	
	documentView: ASTool.DocumentView.create(),
	
	currentPathWillChange: function() {
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
