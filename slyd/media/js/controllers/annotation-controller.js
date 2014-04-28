ASTool.AnnotationController = Em.ObjectController.extend(ASTool.BaseControllerMixin,
	ASTool.DocumentViewDataSource, ASTool.DocumentViewListener, {

	needs: ['application', 'template_index'],

	navigationLabelBinding: 'content.name',
	
	mappingAttribute: null,
	
	documentView: null,

	currentlySelectedElement: null,

	_selectingIgnore: false,

	highlightedElement: null,

	scrapedItemBinding: 'controllers.template_index.scrapedItem',

	urlBinding: 'controllers.template_index.url',

	maxVariantBinding: 'controllers.template_index.maxVariant',
	
	selectingIgnore: function(key, selectingIgnore) {
		if (arguments.length > 1) {
			this.set('_selectingIgnore', selectingIgnore);
			if (selectingIgnore) {
				this.set('documentView.restrictToDescendants', this.get('content.element'));
				this.set('documentView.partialSelectionEnabled', false);
			} else {
				this.set('documentView.restrictToDescendants', null);
				this.set('documentView.partialSelectionEnabled', true);
			}
		}
		return this.get('_selectingIgnore');
	}.property('_selectingIgnore'),

	sprites: function() {
		var sprites = [];
		if (this.get('currentlySelectedElement')) {
			sprites.pushObject(ASTool.AnnotationSprite.create(
				{ 'annotation': this.content,
				  'highlighted': 'true' }));
		}
		if (this.highlightedElement) {
			sprites.pushObject(ASTool.ElementSprite.create({
				element: this.highlightedElement,
				fillColor: 'rgba(255,149,0,0.2)',
				strokeColor: 'rgba(255,149,0,0.6)',
				zPosition: 1000,
			}));
		}

		var annotationSprites = this.get('controllers.template_index.sprites').filter(function(sprite) {
			return sprite.get('annotation.id') != this.content.get('id');
		}.bind(this));

		var ignoredElements = this.get('content.ignores').map(function(ignore) {
			return ASTool.IgnoreSprite.create({ ignore: ignore });
		});

		return sprites.concat(annotationSprites).concat(ignoredElements);
	}.property('currentlySelectedElement',
			   'controllers.template_index.sprites',
			   'content.ignores.@each.highlighted',
			   'content.ignores.@each.ignoreBeneath',
			   'highlightedElement'),
	
	clearGeneratedIns: function(insElement) {
		$(insElement).removePartialAnnotation();
	},
	
	cancelEdit: function() {
		this.set('content.selectedElement', null);
		if (this.get('content.generated') &&
			this.get('content.element') != this.get('currentlySelectedElement')) {
			this.clearGeneratedIns(this.get('currentlySelectedElement'));
		}
		this.transitionToRoute('template');
	},

	saveEdit: function() {
		this.get('controllers.template_index').saveAnnotations();
		this.transitionToRoute('template');
	},
	
	actions: {
		
		doneEditing: function(annotation) {
			this.saveEdit(annotation);
		},
		
		cancelEdit: function(annotation) {
			this.cancelEdit(annotation);
		},
		
		mapAttribute: function(attribute) {
			this.set('mappingAttribute', attribute);
		},

		fieldSelected: function(field) {
			this.get('content').addMapping(this.get('mappingAttribute.name'), field);
			this.set('mappingAttribute', null);
		},

		makeSticky: function(attribute) {
			this.get('controllers.template_index').makeSticky(this.get('content'),
				attribute.get('name'));
		},

		unmapAttribute: function(attribute) {
			this.get('content').removeMapping(attribute.name);
		},

		deleteIgnore: function(ignore) {
			this.get('content.ignores').removeObject(ignore);
		},

		highlightElement: function(element) {
			this.set('highlightedElement', element);
			if (element) {
				this.documentView.scrollToElement(element);	
			}
		},

		selectElement: function(element) {
			this.documentActions['elementSelected'].call(this, element);
		}
	},

	confirmChangeSelection: function() {
		return confirm(ASTool.Messages.get('confirm_change_selection'));
	},
	
	documentActions: {
		
		elementSelected: function(element, mouseX, mouseY, partialSelection) {
			if (this.get('selectingIgnore')) {
				if (element) {
					this.get('content').addIgnore(element);	
				}
				this.set('selectingIgnore', false);
			} else {
				var needsConfirmation = this.get('content.ignores').length ||
					this.get('content.mappedAttributes').length;
				if (!needsConfirmation || this.confirmChangeSelection()) {
					if (this.get('content.generated')) {
						this.clearGeneratedIns(this.get('content.element'));	
					}
					this.set('highlightedElement', null);
					this.set('content.selectedElement', element);
					this.set('content.generated', !!partialSelection);
					this.get('content').removeIgnores();
					this.get('content').removeMappings();
					this.set('currentlySelectedElement', element);
				}
			}
		},
		
		partialSelection: function(selection, mouseX, mouseY) {
			var element = $('<ins/>').get(0);
			selection.getRangeAt(0).surroundContents(element);
			this.documentActions['elementSelected'].call(
				this, element, mouseX, mouseY, true);
			selection.collapse();
		},
	},

	willEnter: function() {
		this.get('documentView').config({ mode: 'select',
										  listener: this,
										  dataSource: this,
										  partialSelects: true });
		this.set('currentlySelectedElement', this.get('content.element'));
	},

	willLeave: function() {
		this.set('selectingIgnore', false);
		this.set('currentlySelectedElement', null);
	},
});
