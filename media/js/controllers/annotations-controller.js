ASTool.AnnotationsController = Em.ArrayController.extend(ASTool.RouteBrowseMixin, {
	
	needs: ['application', 'annotation'],

	template: null,
	
	documentView: null,

	currentlySelectedElement: null,

	nameBinding: 'template.templateName',

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

	maxVariant: function() {
		var maxVariant = 0;
		this.get('content').forEach(function(annotation) {
			var stringVariant = annotation.get('variant');
			var variant = stringVariant ? parseInt(stringVariant) : 0;
			maxVariant = variant > maxVariant ? variant : maxVariant;
		});
		return maxVariant;
	}.property('content.@each.variant'),

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
			this.renameTop('Template: ' + newName);
		},
	},

	willEnter: function() {
		this.get('documentView').config({ mode: 'browse',
										  listener: this,
										  dataSource: this, });
	},
});