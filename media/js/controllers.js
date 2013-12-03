ASTool.RouteBrowseMixin = Ember.Mixin.create({

	pushRoute: function(route, label, model) {
		this.get('controllers.application').pushRoute(route, label, model);
	},

	popRoutes: function(route) {
		this.get('controllers.application').popRoutes(route);
	},

});


ASTool.AnnotationsController = Em.ArrayController.extend(ASTool.RouteBrowseMixin, {
	
	needs: ['application', 'annotation'],

	template: null,
	
	documentViewBinding: 'controllers.application.documentView',

	currentlySelectedElement: null,

	sprites: [],
		
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
		this.pushRoute('annotation', annotation.get('name'), annotation);
	},
	
	deleteAllAnnotations: function() {
		var annotations = this.get('content').toArray();
		annotations.invoke('deleteRecord');
		annotations.invoke('save');
	},

	saveAnnotations: function() {
		if (this.get('template')) {
			this.set('template.annotated_body', this.get('documentView').getAnnotatedDocument());
		}
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
			annotation.save().then(this.saveAnnotations.bind(this));
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


ASTool.AnnotationController = Em.ObjectController.extend(ASTool.RouteBrowseMixin, {

	needs: ['application', 'annotations'],

	hasUnfinishedEdit: false,
	
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
	
	clearGeneratedIns: function(insElement) {
		$(insElement).removePartialAnnotation();
	},
	
	cancelEdit: function(annotation) {
		// FIXME: If we are editing a partial annotation and we cancel we
		// may lose the partial annotation.
		this.set('selectingIgnore', false);
		this.set('documentView.restrictToDescendants', false);
		this.set('documentView.partialSelectionEnabled', true);
		this.set('hasUnfinishedEdit', false);
		annotation.set('selectedElement', null);
		var isPartial = this.get('isPartial');

		if (!annotation.get('element')) {
			annotation.deleteRecord();
			annotation.save();	
		} else {
			annotation.rollback();
			annotation.reload();
		}
		if (isPartial &&
			annotation.get('element') != this.get('currentlySelectedElement')) {
			this.clearGeneratedIns(this.get('currentlySelectedElement'));
		}
		this.set('currentlySelectedElement', null);
		this.popRoutes('annotation');
	},
	
	actions: {
		
		doneEditing: function(annotation) {
			annotation.save().then(function() {
				this.set('hasUnfinishedEdit', false);
				annotation.set('selectedElement', null);
				this.get('controllers.annotations').saveAnnotations();
				this.popRoutes('annotation');
			}.bind(this));
		},
		
		cancelEdit: function(annotation) {
			this.cancelEdit(annotation);
		},
		
		mapAttribute: function(attribute) {
			attribute.set('annotation', this.get('model'));
			this.set('mappingAttribute', attribute);
			this.pushRoute('items', 'Items');
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
					if (this.get('isPartial')) {
						this.clearGeneratedIns(this.get('currentlySelectedElement'));	
					}
					this.content.set('selectedElement', element);
					this.content.set('isPartial', false);
					this.content.removeIgnores();
					this.content.removeMappings();
					this.set('currentlySelectedElement', element);
				}
			}
			this.set('documentView.partialSelectionEnabled', true);
		},
		
		partialSelection: function(selection) {
			var needsConfirmation = this.get('ignores').length || this.get('mappedAttributes').length;
			if (!needsConfirmation || this.confirmChangeSelection()) {
				if (this.get('isPartial')) {
						this.clearGeneratedIns(this.get('currentlySelectedElement'));	
				}
				var element = $('<ins/>').get(0);
				selection.getRangeAt(0).surroundContents(element);
				this.content.set('selectedElement', element);
				this.content.set('isPartial', true);
				this.content.removeIgnores();
				this.content.removeMappings();
				this.set('currentlySelectedElement', element);
			}
			selection.collapse();
		},
	},

	willEnter: function() {
		this.set('hasUnfinishedEdit', true);
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


ASTool.ItemsController = Em.ArrayController.extend(ASTool.RouteBrowseMixin, {
	
	needs: ['application', 'annotation'],
	
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
			this.popRoutes('items');
			this.set('mappingAttribute', null);	   
		}
	},
});


ASTool.SpiderController = Em.ObjectController.extend(ASTool.RouteBrowseMixin, {
	
	needs: ['application', 'annotations'],

	pageUrl: 'http://dmoz.org',

	loadedUrl: null,

	loadedPageData: null,

	editTemplate: function(template) {
		this.get('controllers.annotations').deleteAllAnnotations();
		this.set('controllers.annotations.template', template);
		this.get('controllers.application.documentView')
		.displayAnnotatedDocument(template.get('annotated_body'),
			function(docIframe){
				ASTool.set('iframe', docIframe);
				this.pushRoute('annotations', template.get('name'));
			}.bind(this)
		);
	},

	loadPage: function() {
		this.popRoutes('annotations');
		this.set('loadedUrl', null);
		this.get('controllers.application.documentView').showLoading();
		ASTool.api.fetchDocument(this.get('pageUrl'), this.content.get('name'), function(data) {
			this.get('controllers.application.documentView')
			.displayAnnotatedDocument(data.page,
				function(docIframe){
					this.set('loadedUrl', this.get('pageUrl'));
					this.set('loadedPageData', data.page);
				}.bind(this)
			);
		}.bind(this));
	},

	addTemplate: function() {
		var template = this.store.createRecord('template');
		template.set('id', guid());
		this.content.get('templates').pushObject(template);
		this.get('controllers.annotations').deleteAllAnnotations();
		template.set('annotated_body', this.get('loadedPageData'));
		template.set('original_body', this.get('loadedPageData'));
		template.set('url', this.get('loadedUrl'));
		this.editTemplate(template);
	},
	
	actions: {

		editTemplate: function(template) {
			this.editTemplate(template);
		},

		addTemplate: function() {
			this.addTemplate();
		},

		saveSpider: function() {
			this.content.save();
		},

		loadPage: function() {
			this.loadPage();
		}
	},

	willEnter: function() {
		this.set('controllers.annotations.template', null);
	},
});

ASTool.ProjectController = Em.ArrayController.extend(ASTool.RouteBrowseMixin, {

	needs: ['application'],

	actions: {

		editSpider: function(spiderName) {
			this.pushRoute('spider', spiderName, spiderName);
		},

		addSpider: function() {
			// Find a unique spider name.
			var newSpiderName = guid().substring(0, 5);
			while(this.content.any(function(spiderName){ return spiderName == newSpiderName })) {
				newSpiderName += '0';
			}
			var spider = this.store.createRecord('spider', { 'id': newSpiderName });
			this.pushObject(spider.get('name'));
			spider.save();
		}
	}
});

ASTool.NavRoute = Em.Object.extend({
	route: null,
	label: null,
	model: null,
});

ASTool.ApplicationController = Em.Controller.extend(ASTool.RouteBrowseMixin, {

	modelMap: {},

	labelMap: {},

	routeStack: [],
	
	documentView: null,

	pushRoute: function(route, label, model) {
		// Remove the route if it's already  there.
		this.popRoutes(route);
		var navRoute = ASTool.NavRoute.create({route: route, label: label, model: model});
		this.routeStack.pushObject(navRoute);
		if (model) {
			this.transitionToRoute(route, model);		
		} else {
			this.transitionToRoute(route);
		}
	},

	popRoutes: function(route) {
		var navRoute = this.routeStack.filterBy('route', route).get('firstObject');
		if (navRoute) {
			var tmp = this.routeStack.toArray();
			var found = false;
			tmp.forEach(function(navRoute) {
				if (found || navRoute.route == route) {
					found = true;
					this.routeStack.removeObject(navRoute);
				}
			}.bind(this));
			var lastRoute = this.routeStack.get('lastObject');
			if (lastRoute.model) {
				this.transitionToRoute(lastRoute.route, lastRoute.model);	
			} else {
				this.transitionToRoute(lastRoute.route);
			}
		}
	},
	
	actions: {

		gotoRoute: function(route) {
			var navRoute = this.routeStack.filterBy('route', route).get('firstObject');
			if (navRoute.model) {
				this.transitionToRoute(route, navRoute.model);	
			} else {
				this.transitionToRoute(route);
			}
		},
	}
});
