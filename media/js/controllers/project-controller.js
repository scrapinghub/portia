ASTool.ProjectController = Em.ArrayController.extend(ASTool.RouteBrowseMixin, {

	needs: ['application'],

	documentView: null,

	spiderPage: null,

	nameBinding: 'slyd.project',

	addSpider: function() {
		// Find a unique spider name.
		var newSpiderName = ASTool.guid().substring(0, 5);
		while(this.content.any(function(spiderName){ return spiderName == newSpiderName })) {
			newSpiderName += '0';
		}
		
		if (this.get('spiderPage')) {
			this.set('controllers.application.newSpiderSite', this.get('spiderPage'));
		}
		var spider = this.store.createRecord('spider', 
			{ 'id': newSpiderName,
			  'start_urls': [],
			  'follow_patterns': [],
			  'exclude_patterns': [],
			  'init_requests': [] });
		this.pushObject(newSpiderName);
		return spider.save().then(function() {
				this.editSpider(newSpiderName);
		}.bind(this));
	},

	editSpider: function(spiderName) {
		this.pushRoute('spider', spiderName, 'fade', spiderName);
	},

	actions: {

		editSpider: function(spiderName) {
			this.editSpider(spiderName);
		},

		addSpider: function() {
			this.addSpider();
		},

		deleteSpider: function(spiderName) {
			if (confirm('Are you sure you want to delete spider ' + spiderName + '?')) {
				this.get('slyd').deleteSpider(spiderName);
				this.removeObject(spiderName);
			}
		},

		gotoItems: function() {
			this.pushRoute('items', 'Items');
		},

		rename: function(oldName, newName) {
			if (confirm('Are you sure you want to rename this project? This operation cannot be undone.')) {
				this.get('slyd').renameProject(oldName, newName).then(
					function() {
						this.updateTop(newName, newName);
					}.bind(this),
					function(reason) {
						this.set('name', oldName);
						alert('The name ' + newName + ' is not a valid project name.');
					}.bind(this)
				);
			} else {
				this.set('name', oldName);
			}
		},
	},

	willEnter: function() {
		this.get('documentView').showSpider();
		if (this.get('controllers.application.newSpiderSite')) {
			Em.run.next(this, this.addSpider);
		}
	},
});
