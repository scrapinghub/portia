/* Router config */
ASTool.Router.reopen({
	location: 'none'
});


/* Route Map */
ASTool.Router.map(function() {
	this.resource('page');
	this.resource('annotations');
	this.resource('annotation', {path: '/annotation/:annotation_id'});
	this.resource('items');
	this.resource('item', {path: '/item/:item_id'});
});


/* Routes */
ASTool.ApplicationRoute = Em.Route.extend({
});

ASTool.AnnotationsRoute = Ember.Route.extend({
	model: function() {
		return this.store.find('annotation');
	},
	
	setupController: function(controller, model) {
		controller.set('model', model);
		controller.get('documentView').elementSelectionEnabled(false);
		controller.get('documentView').set('selectionsSource', controller);
	},
	
});

ASTool.AnnotationRoute = Ember.Route.extend({
	model: function(params) {
		return ASTool.annotationsStore.find(params.annotation_id);
	},
	
	setupController: function(controller, model) {
		controller.set('model', model);
		controller.get('controllers.application').set('documentListener', controller);
		controller.get('documentView').elementSelectionEnabled(true);
		controller.get('documentView').set('selectionsSource', controller);
		controller.set('currentlySelectedElement', model.get('element'));
	},
});

ASTool.ItemsRoute = Ember.Route.extend({
	model: function() {
		return this.store.find('item');
	}
});
