ASTool.RouteBrowseMixin = Ember.Mixin.create({
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

	transitionToRouteAnimated: function(route, animation, model) {
		if (Ember.testing) {
			// Disable animations during testing.
			if (model) {
				return this.transitionToRoute(route, model);
			} else {
				return this.transitionToRoute(route);
			}
		} else {
			return this._super.apply(this, arguments);
		}
	},

	lastRoute: function() {

	}.property('routeStack'),

	currentRoute: function() {
		return this.routeStack.get('lastObject');
	}.property('routeStack'),

	previousRoutes: function() {
		return this.routeStack.slice(0, this.routeStack.length - 1);
	}.property('routeStack'),

	clearRoutes: function() {
		this.routeStack.length = 0;
	},

	openAccordion: function(accordionNumber) {
		$( ".accordion" ).accordion("option", "active", accordionNumber);
	},

	actions: {

		back: function(animation) {
			this.popRoute(animation);	
		},

		gotoRoute: function(route, animation) {
			ASTool.ToolboxViewMixin.expandToolbox = true;
			this.popRoutes(route, animation);
		},
	},
});
