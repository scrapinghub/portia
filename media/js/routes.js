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


ASTool.ProjectsRoute = Ember.Route.extend({
	model: function() {
		return this.get('slyd').getProjectNames();
	},
});


ASTool.ProjectRoute = Ember.Route.extend({
	model: function(params) {
		this.set('slyd.project', params.project_id);
		return this.get('slyd').getSpiderNames();
	},
});


ASTool.SpiderRoute = Ember.Route.extend({
	model: function(params) {
		return this.store.find('spider', params.spider_id);
	},

	afterModel: function(model) {
		// The spider spec only supports 'patterns' or 'none' for the
		// 'links_to_follow' attribute; 'all' is only used for UI purposes.
		if (model.get('links_to_follow') == 'patterns' &&
		    Em.isEmpty(model.get('follow_patterns')) &&
			Em.isEmpty(model.get('exclude_patterns'))) {
			model.set('links_to_follow', 'all');
		}
	},

	renderTemplate: function() {
		this.render('spider', {
      		outlet: 'main',
      		controller: 'spider',
    	});

    	this.render('page-browser', {
      		outlet: 'pageBrowser',
      		controller: 'spider',
    	});
	},
});


ASTool.AnnotationsRoute = Ember.Route.extend({
	beforeModel: function() {
		var controller = this.controllerFor('annotations');
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
});


ASTool.AnnotationRoute = Ember.Route.extend({
	model: function(params) {
		return this.store.find(params.annotation_id);
	},
});


ASTool.ItemsRoute = Ember.Route.extend({
	model: function() {
		return this.get('slyd').loadItems();
	}
});
