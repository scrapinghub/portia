/* Router config */
ASTool.Router.reopen({
	location: 'none'
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


/* Routes */
ASTool.ApplicationRoute = Ember.Route.extend({
	setupController: function(controller) {
		if (!controller.get('documentView')) {
			controller.set('documentView', ASTool.DocumentView.create());
		}
	},
})


ASTool.ProjectRoute = Ember.Route.extend({
	model: function() {
		var promise = Ember.RSVP.Promise(function(resolve) {
			ASTool.api.getSpiderNames(function(spiderNames) {	
				resolve(spiderNames);
			});
		});
		return promise;
	},
});


ASTool.SpiderRoute = Ember.Route.extend({
	model: function(params) {
		return this.store.find('spider', params.spider_id);
	},
});


ASTool.AnnotationsRoute = Ember.Route.extend({
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
		return this.store.find('item');
	}
});
