/* Router config */
ASTool.Router.reopen({
	// TODO: use 'hash' here.
	location: 'hash',
});


/* Route Map */
ASTool.Router.map(function() {
	this.resource('projects', function() {
		this.resource('project', { path: ':project_id' }, function() {
			this.resource('spider', { path: ':spider_id' }, function() {
				this.resource('template', { path: ':template_id' }, function() {
					this.resource('items');
					this.resource('annotation', { path: ':annotation_id' });
				});
			});
			
		});
	});
});


ASTool.IndexRoute = Ember.Route.extend({
	activate: function() {
		this.transitionTo('projects');
	},
}),


ASTool.ProjectsIndexRoute = Ember.Route.extend({
	model: function() {
		return this.get('slyd').getProjectNames();
	},

	renderTemplate: function() {
		var controller = this.controllerFor('projects.index');
		this.render('projects/index', {
      		controller: controller,
    	});

    	this.render('topbar-projects', {
    		into: 'application',
      		outlet: 'topbar',
      		controller: controller,
    	});
	},
});


ASTool.ProjectRoute = Ember.Route.extend({
	model: function(params) {
		this.set('slyd.project', params.project_id);
		return { id: params.project_id };
	},
});


ASTool.ProjectIndexRoute = Ember.Route.extend({
	model: function() {
		return this.get('slyd').getSpiderNames();
	},

	renderTemplate: function() {
		var controller = this.controllerFor('project.index');
		this.render('project/index', {
      		controller: controller,
    	});

    	this.render('topbar-project', {
    		into: 'application',
      		outlet: 'topbar',
      		controller: controller,
    	});
	},

	serialize: function(model, params) {
		var controller = this.controllerFor('project');
		return { project_id: controller.get('name') };
	},
});


ASTool.SpiderRoute = Ember.Route.extend({
	model: function(params) {
		return this.get('slyd').loadSpider(params.spider_id);
	},
}),


ASTool.SpiderIndexRoute = Ember.Route.extend({
	model: function(params) {
		return this.modelFor('spider');
	},

	afterModel: function() {
		// Load the items.
		var controller = this.controllerFor('spider.index');
		return this.get('slyd').loadItems().then(function(items) {
			controller.set('itemDefinitions', items);
		});
	},

	renderTemplate: function() {
		var controller = this.controllerFor('spider.index');
		this.render('spider/index', {
      		controller: controller,
    	});

    	this.render('topbar-browse', {
    		into: 'application',
      		outlet: 'topbar',
      		controller: controller,
    	});
	},
});


ASTool.TemplateRoute = Ember.Route.extend({
	model: function(params) {
		var spider = this.modelFor('spider');
		return spider.get('templates').findBy('id', params.template_id);
	},
});


ASTool.TemplateIndexRoute = Ember.Route.extend({
	
	model: function(params) {
		return this.modelFor('template');
	},

	afterModel: function(model) {
		var controller = this.controllerFor('template.index');
		var slyd = this.get('slyd');
		// Load the annotations if we can.
		if (controller.get('documentView').getIframe().length) {
			var annotationsPromise = new Ember.RSVP.Promise(function(resolve) {
				controller.get('documentView').displayDocument(
					model.get('annotated_body'),
					function(docIframe){
						ASTool.set('iframe', docIframe);
						resolve();
					}
				);
			}).then(function() {
				return this.get('annotationsStore').findAll();
			}.bind(this)).then(function(annotations) {
				controller.set('annotationsLoaded', true);
				controller.set('annotations', annotations);
			});	
		} else {
			// If we fall here, the iframe was not yet inserted in the DOM
			// thus preventing loading the annotations. We just mark the
			// controller so it can fix the issue later.
			controller.set('annotationsLoaded', false);
		}
		
		// Load the items.
		var itemsPromise = slyd.loadItems().then(function(items) {
			controller.set('items', items);
		});
		// Load the extractors.
		var extractorsPromise = slyd.loadExtractors().then(function(extractors) {
			controller.set('extractors', extractors);
		});
		return Em.RSVP.all([annotationsPromise, itemsPromise, extractorsPromise])
	},

	renderTemplate: function() {
		var controller = this.controllerFor('template.index');
		this.render('template/index', {
      		controller: controller,
    	});
    	this.render('topbar-extraction', {
    		into: 'application',
      		outlet: 'topbar',
      		controller: controller,
    	});
	},
});


ASTool.AnnotationRoute = Ember.Route.extend({
	
	model: function() {
		return null;
	},

	afterModel: function(model) {
		if (Em.isEmpty(model)) {
			this.transitionTo('template');	
		}
	},

	renderTemplate: function() {
		var controller = this.controllerFor('annotation');
		this.render('annotation', {
      		controller: controller,
    	});

    	this.render('topbar-extraction', {
    		into: 'application',
      		outlet: 'topbar',
      		controller: 'annotation',
    	});
	},
});


ASTool.ItemsRoute = Ember.Route.extend({
	model: function() {
		return this.get('slyd').loadItems();
	},

	renderTemplate: function() {
		this.render('items', {
			into: 'application',
      		outlet: 'main',
      		controller: 'items',
    	});

    	this.render('topbar-extraction', {
    		into: 'application',
      		outlet: 'topbar',
      		controller: 'items',
    	});
	},
});
