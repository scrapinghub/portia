/* Router config */
ASTool.Router.reopen({
	// TODO: use 'hash' here.
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
			this.resource('conflicts');
		});
	});
});


ASTool.IndexRoute = Ember.Route.extend({
	activate: function() {
		this.transitionTo('projects');
	},
}),


ASTool.ProjectsRoute = Ember.Route.extend({
	breadcrumbs: {name: ' '},
}),


ASTool.ProjectsIndexRoute = Ember.Route.extend({

	model: function() {
		return this.get('slyd').getProjectNames();
	},

	renderTemplate: function() {
		var controller = this.controllerFor('projects.index');
		this.render('toolbox-projects', {
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
	breadcrumbs: {name: 'Project'},

	model: function(params) {
		this.set('slyd.project', params.project_id);
		this.set('breadcrumbs.name', params.project_id);
		return this.get('slyd').editProject(params.project_id, 'master').then(function() {
			return { id: params.project_id };
		}, function(err) {
			// Handle issue where branch needed to be created
			this.get('slyd').editProject(params.project_id, 'master').then(function() {
				return { id: params.project_id };
			});
		});
	},
});


ASTool.ProjectIndexRoute = Ember.Route.extend({
	model: function() {
		return this.get('slyd').getSpiderNames();
	},

	afterModel: function() {
		if (ASTool.get('serverCapabilities.version_control')) {
			var controller = this.controllerFor('project.index');
			return this.get('slyd').conflictedFiles(this.get('slyd.project')).then(
				function(conflictedFiles) {
					if (Object.keys(conflictedFiles).length !== 0) {
						// If there are conflicted files, redirect the user to
						// automated concept resolution.
						this.transitionTo('conflicts');
					}
				}.bind(this)
			).then(function() {
				return this.get('slyd').changedFiles(this.get('slyd.project'));
			}.bind(this)).then(function(changes) {
				controller.set('changedFiles', changes);
			});
		}
	},

	renderTemplate: function() {
		var controller = this.controllerFor('project.index');
		this.render('toolbox-project', {
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
	breadcrumbs: {name: 'Spider'},

	model: function(params) {
		this.set('breadcrumbs.name', params.spider_id);
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
		this.render('toolbox-spider', {
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
	breadcrumbs: {name: 'Template'},

	model: function(params) {
		var spider = this.modelFor('spider');
		this.set('breadcrumbs.name', params.template_id);
		return this.get('slyd').loadTemplate(spider.get('name'), params.template_id);
	},
});


ASTool.TemplateIndexRoute = Ember.Route.extend({

	model: function(params) {
		return this.modelFor('template');
	},

	afterModel: function(model) {
		var annotationsPromise;
		var controller = this.controllerFor('template.index');
		controller.set('annotationsLoaded', false);
		var slyd = this.get('slyd');
		// Load the annotations if we can.
		if (controller.get('documentView').getIframe().length) {
			annotationsPromise = new Ember.RSVP.Promise(function(resolve) {
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
				controller.set('annotations', annotations);
				controller.set('annotationsLoaded', true);
			});
		} else {
			// If we fall here, the iframe was not yet inserted in the DOM
			// thus preventing loading the annotations. We just reload the
			// route in a while.
			Em.run.later(this, this.refresh, 500);
		}

		// Load the items.
		var itemsPromise = slyd.loadItems().then(function(items) {
			controller.set('items', items);
		});
		// Load the extractors.
		var extractorsPromise = slyd.loadExtractors().then(function(extractors) {
			controller.set('extractors', extractors);
		});
		return Em.RSVP.all([annotationsPromise, itemsPromise, extractorsPromise]);
	},

	renderTemplate: function() {
		var controller = this.controllerFor('template.index');
		this.render('toolbox-template', {
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
		this.render('toolbox-annotation', {
			controller: controller,
		});

		this.render('topbar-extraction', {
			into: 'application',
			outlet: 'topbar',
			controller: controller,
		});
	},
});


ASTool.ItemsRoute = Ember.Route.extend({
	model: function() {
		return this.get('slyd').loadItems();
	},

	renderTemplate: function() {
		var controller = this.controllerFor('items');
		this.render('toolbox-items', {
			into: 'application',
			outlet: 'main',
			controller: controller,
		});

		this.render('topbar-extraction', {
			into: 'application',
			outlet: 'topbar',
			controller: controller,
		});
	},
});

ASTool.ConflictsRoute = Ember.Route.extend({
	model: function() {
		return this.get('slyd').conflictedFiles(this.get('slyd.project'));
	},

	renderTemplate: function() {
		var controller = this.controllerFor('conflicts');
		this.render('toolbox-conflicts', {
			into: 'application',
			outlet: 'main',
			controller: controller,
		});

		this.render('topbar-conflicts', {
			into: 'application',
			outlet: 'topbar',
			controller: controller,
		});

		this.render('conflict-resolver', {
			into: 'application',
			outlet: 'conflictResolver',
			controller: controller,
		});
	},
});


ASTool.LoadingRoute = ASTool.ProjectLoadingRoute = ASTool.SpiderLoadingRoute = Ember.Route.extend({

	renderTemplate: function() {
		var controller = this.controllerFor('loading');
		this.render('toolbox-empty', {
			into: 'application',
			outlet: 'main',
			controller: controller,
		});

		this.render('loading', {
			into: 'application',
			outlet: 'conflictResolver',
			controller: controller,
		});

		this.render('topbar-empty', {
			into: 'application',
			outlet: 'topbar',
			controller: controller,
		});
	},
});
