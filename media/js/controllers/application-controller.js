ASTool.NavRoute = Em.Object.extend({
	route: null,
	label: null,
	model: null,
});


ASTool.ApplicationController = Em.Controller.extend(ASTool.RouteBrowseMixin, {

	modelMap: {},

	labelMap: {},

	routeStack: [],
	
	documentView: null,

	pushRoute: function(route, label, animation, model) {
		if (this.routeStack.filterBy('route', route).length) {
			// Don't go if the route is already in the stack.
			return;
		}
		animation = animation || 'fade';
		var navRoute = ASTool.NavRoute.create({ route: route,
												label: label,
												model: model });
		this.routeStack.pushObject(navRoute);
		if (model) {
			this.transitionToRouteAnimated(route, {main: animation}, model);		
		} else {
			this.transitionToRouteAnimated(route, {main: animation});
		}
	},

	popRoutes: function(route, animation) {
		animation = animation || 'fade';
		var navRoute = this.routeStack.filterBy('route', route).get('firstObject');
		if (navRoute) {
			var tmp = this.routeStack.toArray();
			var found = false;
			tmp.forEach(function(navRoute) {
				if (found) {
					this.routeStack.removeObject(navRoute);
				}
				if (navRoute.route == route) {
					found = true;
				}
			}.bind(this));
			var lastRoute = this.routeStack.get('lastObject');
			if (lastRoute.model) {
				this.transitionToRouteAnimated(lastRoute.route, {main: animation}, lastRoute.model);	
			} else {
				this.transitionToRouteAnimated(lastRoute.route, {main: animation});
			}
		}
	},

	popRoute: function(animation) {
		if (this.routeStack.length > 1) {
			this.popRoutes(this.routeStack[this.routeStack.length - 2].route, animation);
		}
	},

	updateTop: function(newLabel, newModel) {
		var topRoute = this.routeStack.get('lastObject');
		topRoute.set('label', newLabel);
		if (newModel) {
			topRoute.set('model', newModel);
		}
	},
	
	actions: {

		gotoRoute: function(route, animation) {
			this.popRoutes(route, animation);
		},
	},

	currentPathDidChange: function() {
		// Always reset the document view when leaving a route.
		this.get('documentView').reset();			
  	}.observes('currentPath'),

  	willDestroy: function() {
  		this.routeStack.length = 0;
  	},
});
