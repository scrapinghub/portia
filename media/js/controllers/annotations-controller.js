ASTool.FieldExtractors = Em.Object.extend({
	fieldName: null,
	extractors: [],
}),


ASTool.AnnotationsController = Em.ArrayController.extend(ASTool.RouteBrowseMixin, {
	
	needs: ['application', 'annotation'],

	template: null,
	
	documentView: null,

	currentlySelectedElement: null,

	nameBinding: 'template.templateName',

	newReExtractor: null,

	_newTypeExtractor: 'null',

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
		return this.get('content').map(function(annotation) {
			if (annotation.get('element')) {
				return ASTool.AnnotationSprite.create({'annotation': annotation});
			} else {
				return null;
			}
		}).filter(function(annotation) {return annotation});
	}.property('content.@each.element', 'content.@each.highlighted'),
		
	addAnnotation: function() {
		var annotation = this.store.createRecord('annotation');
		annotation.save().then(function() {
			this.editAnnotation(annotation);
		}.bind(this));
	},
	
	editAnnotation: function(annotation) {
		annotation.set('highlighted', false);
		annotation.set('template', this.get('template'));
		this.pushRoute('annotation', 'Editing annotation', 'flip', annotation);
	},
	
	deleteAllAnnotations: function() {
		var annotations = this.get('content').toArray();
		annotations.invoke('deleteRecord');
		annotations.invoke('save');
	},

	removeMappings: function() {
		var annotations = this.get('content').toArray();
		annotations.invoke('removeMappings');
		annotations.invoke('save');
	},

	saveAnnotations: function() {
		if (this.get('template')) {
			this.set('template.annotated_body', this.get('documentView').getAnnotatedDocument());
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
		this.get('content').forEach(function(annotation) {
			var stringVariant = annotation.get('variant');
			var variant = stringVariant ? parseInt(stringVariant) : 0;
			maxVariant = variant > maxVariant ? variant : maxVariant;
		});
		return maxVariant;
	}.property('content.@each.variant'),

	getAppliedExtractors: function(fieldName) {
		var extractorIds = this.get('template.extractors.' + fieldName) || [];
		return extractorIds.map(function(extractorId) {
				var extractor = this.get('extractors').filterBy('name', extractorId)[0];
				if (extractor) {
					// Copy the extractor.
					extractor = ASTool.Extractor.create(extractor);
					extractor['fieldName'] = fieldName;
					return extractor;
				} else {
					return null;	
				}
			}.bind(this)
		).filter(function(extractor){ return !!extractor });
	},

	appliedExtractors: function() {
		var appliedExtractors = [];
		var mappedFields = new Em.Set();
		this.get('content').forEach(function(annotation) {
			var mappedAttributes = annotation.get('mappedAttributes');
			mappedAttributes.forEach(function(attribute) {
				var fieldName = attribute.get('mappedField');
				mappedFields.add(fieldName);
			}.bind(this));
		}.bind(this));
		mappedFields.forEach(function(fieldName) {
			var fieldExtractors = new ASTool.FieldExtractors();
			fieldExtractors.set('fieldName', fieldName);
			fieldExtractors.set('extractors', this.getAppliedExtractors(fieldName));
			appliedExtractors.pushObject(fieldExtractors);
		}.bind(this));
		return appliedExtractors;
	}.property('content.@each.mappedAttributes', 'template.extractors', 'extractors.@each'),

	createExtractor: function(extractorType, extractorDefinition) {
		var extractor = ASTool.Extractor.create({
			name: ASTool.guid(),
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

		addAnnotation: function() {
			this.addAnnotation();
		},
		
		deleteAnnotation: function(annotation) {
			annotation.deleteRecord();
			annotation.save().then(this.saveAnnotations.bind(this));
		},

		annotationHighlighted: function(annotation) {
			this.get('documentView').scrollToElement(annotation.get('element'));
		},

		rename: function(oldName, newName) {
			this.updateTop('Template: ' + newName);
		},

		createExtractor: function() {
			if (this.get('newReExtractor')) {
				this.createExtractor('regular_expression', this.get('newReExtractor'));
				this.set('newReExtractor', null);
			} else {
				this.createExtractor('type_extractor', this.get('newTypeExtractor'));	
			}
			this.saveExtractors();
		},

		deleteExtractor: function(extractor) {
			this.get('extractors').removeObject(extractor);
			this.saveExtractors();
		},

		applyExtractor: function(fieldName, extractorId) {
			var currentExtractors = this.get('template.extractors')[fieldName];
			if (!currentExtractors) {
				currentExtractors = [];
				this.set('template.extractors.' + fieldName, currentExtractors);
			}
			if (currentExtractors.indexOf(extractorId) == -1) {
				currentExtractors.pushObject(extractorId);
				this.notifyPropertyChange('template.extractors');
			}
		},

		removeAppliedExtractor: function(appliedExtractor) {
			var fieldName = appliedExtractor['fieldName'];
			this.get('template.extractors')[fieldName].removeObject(appliedExtractor['name']);
			this.notifyPropertyChange('template.extractors');
		},
	},

	willEnter: function() {
		this.get('documentView').config({ mode: 'browse',
										  listener: this,
										  dataSource: this, });
	},
});
