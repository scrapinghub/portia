ASTool.MappedFieldData = Em.Object.extend({
	fieldName: null,
	extractors: [],
	required: false,
}),


ASTool.TemplateIndexController = Em.ObjectController.extend(ASTool.BaseControllerMixin,
	ASTool.DocumentViewDataSource, ASTool.DocumentViewListener, {
	
	needs: ['application', 'items'],

	annotations: [],

	items: [],

	extractors: [],

	annotationsLoaded: false,

	scrapedItem: function() {
		if (!Em.isEmpty(this.get('items'))) {
			return this.get('items').findBy('name', this.get('content.scrapes'));	
		} else {
			return null;
		}
	}.property('content.scrapes', 'items.@each'),
	
	documentView: null,

	currentlySelectedElement: null,

	newReExtractor: null,

	_newTypeExtractor: 'null',

	url: function() {
		var url = this.get('content.url');
		if (url.length > 80) {
			url = url.substring(0, 80) + '...';
		}
		return url;
	}.property('content.url'),

	newTypeExtractor: function(key, type) {
		if (arguments.length > 1) {
			this.set('_newTypeExtractor', type);
			if (type) {
				this.set('newReExtractor', null);
			}
		}
		return this.get('_newTypeExtractor');
	}.property('_newTypeExtractor'),

	createExtractorDisabled: function() {
		return !this.get('newTypeExtractor') && !this.get('newReExtractor');
	}.property('newReExtractor', 'newTypeExtractor'),

	sprites: function() {
		return this.get('annotations').map(function(annotation) {
			if (annotation.get('element')) {
				return ASTool.AnnotationSprite.create({'annotation': annotation});
			} else {
				return null;
			}
		}).filter(function(sprite) { return !!sprite; });
	}.property('annotations.@each.element', 'annotations.@each.highlighted'),

	guessInitialMapping: function(annotation) {
		// Very simple implementation. Only works if we are scraping the 
		// default item.
		if (this.get('content.scrapes') != 'default') {
			annotation.addMapping('content', this.get('scrapedItem.fields').get('firstObject.name'));
		} else {
			var element = annotation.get('element');
			var attributes = annotation.get('attributes');
			if (attributes.findBy('name', 'src') && this.get('scrapedItem.fields').anyBy('name', 'image')) {
				annotation.addMapping('src', 'image');
			} else if (attributes.findBy('name', 'href') && this.get('scrapedItem.fields').anyBy('name', 'link')) {
				annotation.addMapping('href', 'link');
			} else if (this.get('scrapedItem.fields').anyBy('name', 'text')){
				annotation.addMapping('content', 'text');
			} else {
				annotation.addMapping('content', null);
			}
		}
	},
		
	addAnnotation: function(element, generated) {
		var annotation = ASTool.Annotation.create({
			id: ASTool.shortGuid(),
			selectedElement: element,
			annotations: {},
			required: [],
			generated: !!generated,
		});
		this.get('annotations').pushObject(annotation);
		this.guessInitialMapping(annotation);
	},

	mapAttribute: function(annotation, attribute, field) {
		annotation.removeMappings();
		annotation.addMapping(attribute, field);
	},
	
	editAnnotation: function(annotation) {
		annotation.set('highlighted', false);
		this.saveAnnotations();
		this.transitionToRoute('annotation', annotation);
	},

	saveAnnotations: function() {
		this.get('annotationsStore').saveAll(this.get('annotations'));
		if (this.get('content')) {
			this.set('content.annotated_body', this.get('documentView').getAnnotatedDocument());
		}
	},

	saveExtractors: function() {
		// Cleanup extractor objects.
		this.get('extractors').forEach(function(extractor) {
			delete extractor['dragging'];
		});
		this.get('slyd').saveExtractors(this.get('extractors'));
	},

	maxVariant: function() {
		var maxVariant = 0;
		this.get('annotations').forEach(function(annotation) {
			var stringVariant = annotation.get('variant');
			var variant = stringVariant ? parseInt(stringVariant) : 0;
			maxVariant = variant > maxVariant ? variant : maxVariant;
		});
		return maxVariant;
	}.property('annotations.@each.variant'),

	maxSticky: function() {
		var maxSticky = 0;
		this.get('annotations').forEach(function(annotation) {
			annotation.get('stickyAttributes').forEach(function(stickyAttribute) {
				var sticky = parseInt(
					stickyAttribute.get('mappedField').substring('_sticky'.length));
				if (sticky > maxSticky) {
					maxSticky = sticky;
				}
			});
		});
		return maxSticky;
	}.property('annotations.@each.stickyAttributes.@each'),

	getAppliedExtractors: function(fieldName) {
		var extractorIds = this.get('content.extractors.' + fieldName) || [];
		return extractorIds.map(function(extractorId) {
				var extractor = this.get('extractors').filterBy('name', extractorId)[0];
				if (extractor) {
					extractor = extractor.copy();
					extractor['fieldName'] = fieldName;
					return extractor;
				} else {
					return null;	
				}
			}.bind(this)
		).filter(function(extractor){ return !!extractor });
	},

	mappedFieldsData: function() {
		var mappedFieldsData = [];
		var seenFields = new Em.Set();
		this.get('annotations').forEach(function(annotation) {
			var mappedAttributes = annotation.get('mappedAttributes');
			mappedAttributes.forEach(function(attribute) {
				var fieldName = attribute.get('mappedField');
				// Avoid duplicates.
				if (!seenFields.contains(fieldName)) {
					seenFields.add(fieldName);
					var mappedFieldData = ASTool.MappedFieldData.create();
					mappedFieldData.set('fieldName', fieldName);
					mappedFieldData.set('required', annotation.get('required').indexOf(fieldName) > -1);
					mappedFieldData.set('extractors', this.getAppliedExtractors(fieldName));
					mappedFieldsData.pushObject(mappedFieldData);
				}
			}.bind(this));
		}.bind(this));
		return mappedFieldsData;
	}.property('annotations.@each.mappedAttributes',
			   'content.extractors',
			   'extractors.@each'),

	annotationsMappingField: function(fieldName) {
		var annotations = new Em.Set();
		this.get('annotations').forEach(function(annotation) {
			var mappedAttributes = annotation.get('mappedAttributes');
			mappedAttributes.forEach(function(attribute) {
				if (attribute.get('mappedField') == fieldName) {
					annotations.add(annotation);
				}
			}.bind(this));
		}.bind(this));
		return annotations;
	},

	createExtractor: function(extractorType, extractorDefinition) {
		var extractor = ASTool.Extractor.create({
			name: ASTool.shortGuid(),
		});
		extractor.set(extractorType, extractorDefinition);
		this.get('extractors').pushObject(extractor);
	},

	draggingExtractor: function() {
		return this.get('extractors').anyBy('dragging');
	}.property('extractors.@each.dragging'),

	actions: {
		
		editAnnotation: function(annotation) {
			this.editAnnotation(annotation);
		},

		mapAttribute: function(annotation, attribute, field) {
			this.mapAttribute(annotation, attribute, field);
		},
		
		deleteAnnotation: function(annotation) {
			if (annotation.get('generated')) {
				$(annotation.get('element')).removePartialAnnotation();
			}
			this.get('annotations').removeObject(annotation);

		},

		createField: function(fieldName, fieldType) {
			this.get('controllers.items').addField(this.get('scrapedItem'), fieldName, fieldType);
			this.get('slyd').saveItems(this.get('items').toArray());
		},

		annotationHighlighted: function(annotation) {
			if (annotation.get('element')) {
				this.get('documentView').scrollToElement(annotation.get('element'));	
			}
		},

		rename: function(oldName, newName) {
			this.replaceRoute('template', this.get('model'));
		},

		createExtractor: function() {
			if (this.get('newReExtractor')) {
				this.createExtractor('regular_expression', this.get('newReExtractor'));
				this.set('newReExtractor', null);
			} else if (this.get('newTypeExtractor')) {
				this.createExtractor('type_extractor', this.get('newTypeExtractor'));	
			}
			this.saveExtractors();
		},

		deleteExtractor: function(extractor) {
			this.get('extractors').removeObject(extractor);
			this.saveExtractors();
		},

		applyExtractor: function(fieldName, extractorId) {
			var currentExtractors = this.get('content.extractors')[fieldName];
			if (!currentExtractors) {
				currentExtractors = [];
				this.set('content.extractors.' + fieldName, currentExtractors);
			}
			if (currentExtractors.indexOf(extractorId) == -1) {
				currentExtractors.pushObject(extractorId);
				this.notifyPropertyChange('content.extractors');
			}
		},

		removeAppliedExtractor: function(appliedExtractor) {
			// TODO: we need to automatically remove extractors when the field they
			// extract is no longer mapped from any annotation.
			var fieldName = appliedExtractor['fieldName'];
			this.get('content.extractors')[fieldName].removeObject(appliedExtractor['name']);
			this.notifyPropertyChange('content.extractors');
		},

		setRequired: function(fieldName, required) {
			var annotations = this.annotationsMappingField(fieldName);
			annotations.forEach(function(annotation) {
				if (required) {
					annotation.addRequired(fieldName);
				} else {
					annotation.removeRequired(fieldName);
				}
			});
		},

		editItems: function() {
			this.transitionToRoute('items');
		},

		continueBrowsing: function() {
			this.saveAnnotations();
			this.transitionToRoute('spider');
		},
	},

	documentActions: {
		
		elementSelected: function(element, partialSelection) {
			this.addAnnotation(element);
		},
		
		partialSelection: function(selection) {
			var element = $('<ins/>').get(0);
			selection.getRangeAt(0).surroundContents(element);
			this.addAnnotation(element, true);
			selection.collapse();
		},
	},

	willEnter: function() {
		if (!this.get('annotationsLoaded')) {
			// When landing here from a shared URL there is an issue that prevents
			// the annotations from being correctly loaded. This hack (reloading
			// the route) ensures that they do load.
			Em.run.later(this, function() {
				// Forces a full model reload.
				this.replaceRoute('template', this.get('id'));
				Ember.run.later(this, function() {
					this.get('documentView').config({ mode: 'select',
							  listener: this,
							  dataSource: this,
							  partialSelects: true });
				}, 100);	
			}, 100);	
		} else {
			this.get('documentView').config({ mode: 'select',
							  listener: this,
							  dataSource: this,
							  partialSelects: true });	
		}
		
	},
});
