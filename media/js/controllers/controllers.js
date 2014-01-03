ASTool.RouteBrowseMixin = Ember.Mixin.create({

	pushRoute: function(route, label, animation, model) {
		this.get('controllers.application').pushRoute(route, label, animation, model);
	},

	popRoutes: function(route, animation) {
		this.get('controllers.application').popRoutes(route, animation);
	},

	popRoute: function(animation) {
		this.get('controllers.application').popRoute(animation);
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

	openAccordion: function(accordionNumber) {
		$( ".accordion" ).accordion("option", "active", accordionNumber);
	},

	actions: {

		back: function(animation) {
			this.popRoute(animation);	
		},
	},
});


