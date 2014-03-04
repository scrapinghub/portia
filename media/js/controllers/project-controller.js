ASTool.ProjectIndexController = Em.ArrayController.extend(ASTool.BaseControllerMixin, {

	needs: ['application', 'spider-index'],

	documentView: null,

	spiderPage: null,

	nameBinding: 'slyd.project',

	createSpiderDisabled: function() {
		return Em.isEmpty(this.get('spiderPage'));
	}.property('spiderPage'),

	addSpider: function() {
		// Find a unique spider name.
		var newSpiderName = ASTool.shortGuid();
		while(this.content.any(function(spiderName){ return spiderName == newSpiderName })) {
			newSpiderName += '0';
		}
		
		if (this.get('spiderPage')) {
			this.set('controllers.application.newSpiderSite', this.get('spiderPage'));
		}
		var spider = ASTool.Spider.create( 
			{ 'name': newSpiderName,
			  'start_urls': [],
			  'follow_patterns': [],
			  'exclude_patterns': [],
			  'init_requests': [],
			  'templates': [] });
		this.pushObject(newSpiderName);
		return this.get('slyd').saveSpider(spider, newSpiderName).then(function() {
				this.editSpider(newSpiderName);
		}.bind(this), function(error) {
			console.log(error);
		});
	},

	editSpider: function(spiderName) {
		this.get('controllers.spider-index').reset();
		this.get('slyd').loadSpider(spiderName).then(function(spider) {
			this.transitionToRoute('spider', spider);
		}.bind(this));
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

		rename: function(oldName, newName) {
			if (confirm('Are you sure you want to rename this project? This operation cannot be undone.')) {
				this.get('slyd').renameProject(oldName, newName).then(
					function() {
						this.replaceRoute('project', { id: newName });
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
