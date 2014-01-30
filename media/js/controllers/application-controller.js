ASTool.NavRoute = Em.Object.extend({
	route: null,
	label: null,
	model: null,
});


ASTool.ApplicationController = Em.Controller.extend(ASTool.RouteBrowseMixin, {

	currentPathDidChange: function() {
		// Always reset the document view when leaving a route.
		this.get('documentView').reset();			
  	}.observes('currentPath'),

  	willDestroy: function() {
  		this.clearRoutes();
  	},
});
