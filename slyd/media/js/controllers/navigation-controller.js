ASTool.NavigationController = Em.Controller.extend({

	needs: ['application', 'project_index', 'spider_index', 'template_index', 'annotation'],

	currentPathBinding: 'controllers.application.currentPath',

	splittedPath: function() {
		return this.get('currentPath').split('.').filter(function(pathElem) {
			return pathElem != 'index';
		});
	}.property('currentPath'),

	previousRoutes: function() {
		var splitted = this.get('splittedPath');
		return splitted.slice(0, splitted.length - 1).map(function(route) {
			return { route: route, label: this.labelForRoute(route) };
		}.bind(this));
	}.property('splittedPath'),

	currentRoute: function() {
		var splitted = this.get('splittedPath');
		var route = splitted[splitted.length - 1];
		return { route: route, label: this.labelForRoute(route) };
	}.property('splittedPath'),

	labelForRoute: function(route) {
		var controllerName = this.get('needs').find(function(name) {
			return name.indexOf(route) === 0;
		});
		if (controllerName) {
			var controller = this.get('controllers.' + controllerName);
			return controller.get('navigationLabel');
		} else {
			return '';
		}
	},

	actions: {

		gotoRoute: function(route) {
			ASTool.ToolboxViewMixin.expandToolbox = true;
			this.transitionToRoute(route);
		},
	},
});
