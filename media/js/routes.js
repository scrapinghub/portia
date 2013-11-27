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


ASTool.ApplicationRoute = Ember.Route.extend({
	setupController: function(controller) {
		if (!controller.get('documentView')) {
			controller.set('documentView', ASTool.DocumentView.create());
		}
	},
})

/* Routes */
ASTool.AnnotationsRoute = Ember.Route.extend({
	beforeModel: function() {
		if (this.get('controller.controllers.annotation.hasUnfinishedEdit')) {
			this.transitionTo('annotation', this.get('controller.controllers.annotation.model'));
		}
	},

	model: function() {
		return this.store.find('annotation');
	},
});

ASTool.AnnotationRoute = Ember.Route.extend({
	model: function(params) {
		return ASTool.annotationsStore.find(params.annotation_id);
	},
});

ASTool.ItemsRoute = Ember.Route.extend({
	model: function() {
		return this.store.find('item');
	}
});
