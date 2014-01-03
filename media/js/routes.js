/* Router config */
ASTool.Router.reopen({
	// TODO: use 'hash' here.
	location: 'none',
});


/* Route Map */
ASTool.Router.map(function() {
	this.resource('project');
	this.resource('spider', {path: '/spiders/:spider_id'});
	this.resource('annotations');
	this.resource('annotation', {path: '/annotations/:annotation_id'});
	this.resource('items');
	this.resource('item', {path: '/items/:item_id'});
});


ASTool.ProjectRoute = Ember.Route.extend({
	model: function() {
		return this.get('slyd').getSpiderNames();
	},
});


ASTool.SpiderRoute = Ember.Route.extend({
	model: function(params) {
		return this.store.find('spider', params.spider_id);
	},
});


ASTool.AnnotationsRoute = Ember.Route.extend({
	beforeModel: function() {
		var controller = this.controllerFor('annotations');
		var promise = new Ember.RSVP.Promise(function(resolve) {
			controller.deleteAllAnnotations();
			controller.get('documentView').displayAnnotatedDocument(
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
		return this.store.find('annotation');
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
