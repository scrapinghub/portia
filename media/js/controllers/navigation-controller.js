ASTool.NavigationController = Em.Controller.extend({

	needs: ['application'],

	currentPathBinding: 'controllers.application.currentPath',

	splittedPath: function() {
		return this.get('currentPath').split('.').filter(function(pathElem) {
			return pathElem != 'index';
		});
	}.property('currentPath'),

	previousRoutes: function() {
		var splitted = this.get('splittedPath');
		return splitted.slice(0, splitted.length - 1)
	}.property('splittedPath'),

	currentRoute: function() {
		var splitted = this.get('splittedPath');;
		return splitted[splitted.length - 1];
	}.property('splittedPath'),

	actions: {

		gotoRoute: function(route) {
			ASTool.ToolboxViewMixin.expandToolbox = true;
			this.transitionToRoute(route);
		},
	},
});
