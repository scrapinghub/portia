/* Router config */
ASTool.Router.reopen({
	// TODO: use 'hash' here.
	location: 'none',
});


/* Route Map */
ASTool.Router.map(function() {
	this.resource('projects');
	this.resource('project', {path: '/project/:project_id'});
	this.resource('spider', {path: '/spiders/:spider_id'});
	this.resource('annotations');
	this.resource('annotation', {path: '/annotations/:annotation_id'});
	this.resource('items');
	this.resource('item', {path: '/items/:item_id'});
});


ASTool.ApplicationRoute = Ember.Route.extend({
	activate: function() {
		var controller = this.controllerFor('application');
		controller.pushRoute('projects', 'Home');
	},
}),


ASTool.ProjectsRoute = Ember.Route.extend({
	model: function() {
		return this.get('slyd').getProjectNames();
	},

	renderTemplate: function() {
		this.render('projects', {
      		outlet: 'main',
      		controller: 'projects',
    	});

    	this.render('topbar-projects', {
      		outlet: 'topbar',
      		controller: 'projects',
    	});
	},
});


ASTool.ProjectRoute = Ember.Route.extend({
	model: function(params) {
		this.set('slyd.project', params.project_id);
		return this.get('slyd').getSpiderNames();
	},

	renderTemplate: function() {
		this.render('project', {
      		outlet: 'main',
      		controller: 'project',
    	});

    	this.render('topbar-project', {
      		outlet: 'topbar',
      		controller: 'project',
    	});
	},
});


ASTool.SpiderRoute = Ember.Route.extend({
	model: function(params) {
		return this.store.find('spider', params.spider_id);
	},

	renderTemplate: function() {
		this.render('spider', {
      		outlet: 'main',
      		controller: 'spider',
    	});

    	this.render('topbar-browse', {
      		outlet: 'topbar',
      		controller: 'spider',
    	});
	},
});


ASTool.AnnotationsRoute = Ember.Route.extend({
	beforeModel: function() {
		var controller = this.controllerFor('annotations');
		return this.get('slyd').loadItems().then(function(items) {
			controller.set('items', items);
			var promise = new Ember.RSVP.Promise(function(resolve) {
				controller.deleteAllAnnotations();
				controller.get('documentView').displayDocument(
					controller.get('template.annotated_body'),
					function(docIframe){
						ASTool.set('iframe', docIframe);
						resolve();
					}
				);
			});
			return promise;
		}.bind(this));
	},

	model: function() {
		return this.store.find('annotation').then(function(annotations) {
			annotations.forEach(function(annotation) {
				annotation.set('template', this.controllerFor('annotations').get('template'));
			}.bind(this));
			return annotations;
		}.bind(this));
	},

	afterModel: function() {
		return this.get('slyd').loadExtractors().then(function(extractors) {
			var controller = this.controllerFor('annotations');
			controller.set('extractors', extractors);
		}.bind(this));
	},

	renderTemplate: function() {
		this.render('annotations', {
      		outlet: 'main',
      		controller: 'annotations',
    	});

    	this.render('topbar-extraction', {
      		outlet: 'topbar',
      		controller: 'annotations',
    	});
	},
});


ASTool.AnnotationRoute = Ember.Route.extend({
	model: function(params) {
		return this.store.find(params.annotation_id);
	},

	renderTemplate: function() {
		this.render('annotation', {
      		outlet: 'main',
      		controller: 'annotation',
    	});

    	this.render('topbar-extraction', {
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
      		outlet: 'main',
      		controller: 'items',
    	});

    	this.render('topbar-extraction', {
      		outlet: 'topbar',
      		controller: 'items',
    	});
	},
});
