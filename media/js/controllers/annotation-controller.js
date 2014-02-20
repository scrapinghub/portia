ASTool.AnnotationController = Em.ObjectController.extend(ASTool.RouteBrowseMixin,
	ASTool.DocumentViewDataSource, ASTool.DocumentViewListener, {

	needs: ['application', 'annotations'],
	
	mappingAttribute: null,
	
	documentView: null,

	currentlySelectedElement: null,

	_selectingIgnore: false,

	openAttributesOnShow: false,

	highlightedElement: null,

	scrapesBinding: 'controllers.annotations.template.scrapes',
	
	selectingIgnore: function(key, selectingIgnore) {
		if (arguments.length > 1) {
			this.set('_selectingIgnore', selectingIgnore);
			if (selectingIgnore) {
				this.set('documentView.restrictToDescendants', this.get('element'));
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
				{'annotation': this.content,
				 'highlighted': 'true'}));
		}

		if (this.highlightedElement) {
			sprites.pushObject(ASTool.ElementSprite.create({
				element: this.highlightedElement,
				fillColor: 'rgba(255,149,0,0.2)',
				strokeColor: 'rgba(255,149,0,0.6)',
				zPosition: 1000,
			}));
		}

		var annotationSprites = this.get('controllers.annotations.sprites').filter(function(sprite) {
			return sprite.get('annotation.id') != this.content.get('id');
		}.bind(this));

		var ignoredElements = this.get('model.ignores').map(function(ignore) {
			return ASTool.IgnoreSprite.create({ ignore: ignore });
		});

		return sprites.concat(annotationSprites).concat(ignoredElements);
	}.property('currentlySelectedElement',
			   'controllers.annotations.sprites',
			   'model.ignores.@each.highlighted',
			   'model.ignores.@each.ignoreBeneath',
			   'highlightedElement'),
	
	clearGeneratedIns: function(insElement) {
		$(insElement).removePartialAnnotation();
	},
	
	cancelEdit: function(annotation) {
		// FIXME: If we are editing a partial annotation and we cancel we
		// may lose the partial annotation.
		this.set('selectingIgnore', false);
		this.set('documentView.restrictToDescendants', false);
		this.set('documentView.partialSelectionEnabled', true);
		annotation.set('selectedElement', null);
		var isPartial = this.get('isPartial');

		if (!annotation.get('element')) {
			annotation.deleteRecord();
			annotation.save();	
		} else {
			annotation.reload();
		}
		if (isPartial &&
			annotation.get('element') != this.get('currentlySelectedElement')) {
			this.clearGeneratedIns(this.get('currentlySelectedElement'));
		}
		this.set('currentlySelectedElement', null);
		this.popRoute();
	},

	attributeMapped: function(attribute, item, field) {
		if (this.get('template.scrapes') != item['name']) {
			var foundMappedAnnotation = false;
			this.get('controllers.annotations.model').forEach(function(annotation) {
				Object.keys(annotation.get('annotations')).forEach(function(key) {
					if (annotation.get('annotations')[key].indexOf('_sticky') != 0) {
						foundMappedAnnotation = true;
					}
				});
			});
			if (foundMappedAnnotation) {
				// Only one item type per template is supported.
				if (confirm('Are you sure that you want to change the item scraped by this template? ' +
							'You will lose all previously defined attribute mappings for this template!')) {
					this.get('controllers.annotations').removeMappings();
				} else {
					return;
				}	
			}
		}
		this.get('content').addMapping(attribute.get('name'), field['name']);
		this.set('template.scrapes', item['name']);
	},
	
	actions: {
		
		doneEditing: function(annotation) {
			annotation.save().then(function() {
				annotation.set('selectedElement', null);
				this.get('controllers.annotations').saveAnnotations();
				this.popRoute();
			}.bind(this));
		},
		
		cancelEdit: function(annotation) {
			this.cancelEdit(annotation);
		},
		
		mapAttribute: function(attribute) {
			attribute.set('annotation', this.get('model'));
			this.set('mappingAttribute', attribute);
			this.set('openAttributesOnShow', true);
			this.pushRoute('items', 'Mapping attribute: ' + attribute.get('name'));
		},

		makeSticky: function(attribute) {
			attribute.set('annotation', this.get('model'));
			var maxSticky = this.get('controllers.annotations.maxSticky');
			var stickyName = '_sticky' + (maxSticky + 1);
			this.content.addMapping(attribute.get('name'), stickyName);
			this.content.addRequired(stickyName);
		},

		unmapAttribute: function(attribute) {
			this.content.removeMapping(attribute.name);
		},

		deleteIgnore: function(ignore) {
			var ignores = this.get('ignores');
			ignores.removeObject(ignore);
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
		return confirm('If you select a different region you will lose all the ignored regions and attribute mappings you defined, proceed anyway?');
	},
	
	documentActions: {
		
		elementSelected: function(element, partialSelection) {
			if (this.get('selectingIgnore')) {
				if (element) {
					this.content.addIgnore(element);	
				}
				this.set('selectingIgnore', false);
			} else {
				var needsConfirmation = this.get('ignores').length || this.get('mappedAttributes').length;
				if (!needsConfirmation || this.confirmChangeSelection()) {
					if (this.get('isPartial')) {
						this.clearGeneratedIns(this.get('currentlySelectedElement'));	
					}
					this.openAccordion(0);
					this.set('highlightedElement', null);
					this.content.set('selectedElement', element);
					this.content.set('isPartial', !!partialSelection);
					this.content.removeIgnores();
					this.content.removeMappings();
					this.set('currentlySelectedElement', element);
				}
			}
		},
		
		partialSelection: function(selection) {
			var element = $('<ins/>').get(0);
			selection.getRangeAt(0).surroundContents(element);
			this.documentActions['elementSelected'].call(this, element, true);
			selection.collapse();
		},
	},

	willEnter: function() {
		this.get('documentView').config({ mode: 'select',
										  listener: this,
										  dataSource: this,
										  partialSelects: true });
		this.set('currentlySelectedElement', this.get('element'));
		if (this.get('openAttributesOnShow')) {
			Em.run.later(this, function() {
				this.openAccordion(1);
			}, 100);
			this.set('openAttributesOnShow', false);
		}
	},

	willLeave: function() {
		this.set('selectingIgnore', false);
	},
});