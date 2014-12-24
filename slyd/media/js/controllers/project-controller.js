ASTool.ProjectIndexController = Em.ArrayController.extend(ASTool.BaseControllerMixin, {

	needs: ['application', 'spider_index'],

	documentView: null,

	spiderPage: null,

	changedFiles: [],

	nameBinding: 'slyd.project',

	navigationLabelBinding: 'slyd.project',

	isDeploying: false,

	createSpiderDisabled: function() {
		return Em.isEmpty(this.get('spiderPage'));
	}.property('spiderPage'),

	hasChanges: function() {
		return !Em.isEmpty(this.get('changedFiles'));
	}.property('changedFiles.[]'),

	addSpider: function() {
		var siteUrl = this.get('spiderPage') || this.get('controllers.application.siteWizard');
		if (siteUrl.indexOf('http') !== 0) {
			siteUrl = 'http://' + siteUrl;
		}
		var newSpiderName = this.getUnusedName(URI.parse(siteUrl).hostname, this.get('content'));
		this.set('controllers.application.siteWizard', siteUrl);
		var spider = ASTool.Spider.create(
			{ 'name': newSpiderName,
			  'start_urls': [],
			  'follow_patterns': [],
			  'exclude_patterns': [],
			  'init_requests': [],
			  'templates': [],
			  'template_names': [] });
		this.pushObject(newSpiderName);
		this.set('spiderPage', null);
		return this.get('slyd').saveSpider(spider).then(function() {
				this.editSpider(newSpiderName);
			}.bind(this), function(err) {
				this.showHTTPAlert('Error Adding Spider', err);
			}.bind(this)
		);
	},

	editSpider: function(spiderName) {
		this.get('slyd').loadSpider(spiderName).then(function(spider) {
			this.transitionToRoute('spider', spider);
		}.bind(this), function() {
			this.showHTTPAlert('Error Editing Spider', err);
		}.bind(this));
	},

	publishProject: function() {
		return this.get('slyd').publishProject(this.get('name'));
	},

	discardChanges: function() {
		return this.get('slyd').discardChanges(this.get('name'));
	},

	deployProject: function() {
		return this.get('slyd').deployProject(this.get('name'));
	},

	actions: {

		editSpider: function(spiderName) {
			this.editSpider(spiderName);
		},

		addSpider: function() {
			this.addSpider();
		},

		deleteSpider: function(spiderName) {
			this.showConfirm('Delete ' + spiderName,
				'Are you sure you want to delete spider ' + spiderName + '?',
				function() {
					this.get('slyd').deleteSpider(spiderName).then(
						function() {
							this.removeObject(spiderName);
							this.get('changedFiles').addObject('spiders/' + spiderName + '.json');
						}.bind(this),
						function(err) {
							this.showHTTPAlert('Delete Error', err);
						}.bind(this)
					);
				}.bind(this)
			).bind(this);
		},

		rename: function(oldName, newName) {
			this.get('slyd').renameProject(oldName, newName).then(
				function() {
					this.replaceRoute('project', { id: newName });
				}.bind(this),
				function(reason) {
					this.set('name', oldName);
					this.showAlert('Save Error','The name ' + newName + ' is not a valid project name.');
				}.bind(this)
			);
		},

		publishProject: function() {
			this.publishProject().then(function(result){
				if (result == 'OK') {
					this.showAlert('Save Successful', ASTool.Messages.get('publish_ok'));
					this.set('changedFiles', []);
				} else if (result == 'CONFLICT') {
					this.showAlert('Save Error', ASTool.Messages.get('publish_conflict'));
					this.transitionToRoute('conflicts');
				}
			}.bind(this));
		},

		deployProject: function() {
			this.set('isDeploying', true);
			this.deployProject().then(function(result) {
				this.set('isDeploying', false);
				if (result['status'] == 'ok') {
					if (!Em.isEmpty(result['schedule_url'])) {
						this.showConfirm('Schedule Project',
							ASTool.Messages.get('deploy_ok_schedule'),
							function() {
								window.location = result['schedule_url'];
							});
					} else {
						this.showAlert('Save Successful', ASTool.Messages.get('deploy_ok'));
					}
				}
			}.bind(this), function(err) {
				this.set('isDeploying', false);
				this.showHTTPAlert('Deploy Error', err);
			}.bind(this));
		},

		discardChanges: function() {
			this.discardChanges().then(function(success){
				this.transitionToRoute('projects');
			}.bind(this), function(err) {
				this.showHTTPAlert('Revert Error', err);
			}.bind(this));
		},

		conflictedFiles: function() {
			this.transitionToRoute('conflicts');
		},
	},

	willEnter: function() {
		this.get('documentView').showSpider();
		if (this.get('documentView.canvas')) {
			this.set('documentView.canvas.interactionsBlocked', true);
		}
		if (this.get('controllers.application.siteWizard')) {
			Em.run.next(this, this.addSpider);
		}
	},

	willLeave: function() {
		if (this.get('documentView.canvas')) {
			this.set('documentView.canvas.interactionsBlocked', false);
		}
	}
});
