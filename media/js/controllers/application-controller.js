ASTool.ApplicationController = Em.Controller.extend(ASTool.BaseControllerMixin, {

	currentPathDidChange: function() {
		// Always reset the document view when leaving a route.
		this.get('documentView').reset();			
  	}.observes('currentPath'),

  	willDestroy: function() {
  		this.clearRoutes();
  	},
});
