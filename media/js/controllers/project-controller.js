ASTool.ProjectController = Em.ArrayController.extend(ASTool.RouteBrowseMixin, {

	needs: ['application'],

	documentViewBinding: 'controllers.application.documentView',

	actions: {

		editSpider: function(spiderName) {
			this.pushRoute('spider', 'Spider: ' + spiderName, 'fade', spiderName);
		},

		addSpider: function() {
			// Find a unique spider name.
			var newSpiderName = ASTool.guid().substring(0, 5);
			while(this.content.any(function(spiderName){ return spiderName == newSpiderName })) {
				newSpiderName += '0';
			}
			var spider = this.store.createRecord('spider', { 'id': newSpiderName });
			this.pushObject(spider.get('name'));
			spider.save();
		},

		gotoItems: function() {
			this.pushRoute('items', 'Items');
		},
	},

	willEnter: function() {
		this.get('documentView').showSpider();	
	},
});