ASTool.ProjectsIndexController = Em.ArrayController.extend(ASTool.BaseControllerMixin, {
	needs: ['application'],

	projectSite: null,

	createProjectDisabled: function() {
		return Em.isEmpty(this.get('projectSite'));
	}.property('projectSite'),

	projectRevisions: {},

	revisionsForProject: function(projectName) {
		if (projectName in this.get('projectRevisions')) {
			return this.get('projectRevisions')[projectName];
		} else {
			return [];
		}
	},

	openProject: function(projectName, revision) {
		this.get('slyd').editProject(projectName, revision).then(function() {
			this.set('slyd.project', projectName);
			this.transitionToRoute('project', { id: projectName });
		}.bind(this));
	},

	exportProject: function(projectName) {
		return this.get('slyd').exportProject(projectName);
	},

	actions: {
		
		openProject: function(projectName) {
			this.openProject(projectName, 'master');
		},

		exportProject: function(projectName) {
			this.exportProject(projectName);
		},

		openProjectRevision: function(projectName, revision) {
			this.openProject(projectName, revision);
		},

		deleteProject: function(projectName) {
			if (confirm('Are you sure you want to delete this project? This operation cannot be undone.')) {
				this.get('slyd').deleteProject(projectName);
				this.removeObject(projectName);
			} 
		},

		createProject: function() {
			var newProjectName = this.getUnusedName('new_project', this.get('content'));
			this.get('slyd').createProject(newProjectName).then(function() {
				this.get('slyd').editProject(newProjectName).then(function() {
					this.set('slyd.project', newProjectName);
					// Initialize items spec.
					itemsPromise = this.get('slyd').saveItems([
						ASTool.Item.create({ name: 'default', fields: [ ]
						})
					]);
					// Initialize extractors spec.
					extractorsPromise = this.get('slyd').saveExtractors([]);
					// Setup automatic creation of an initial spider.
					this.set('controllers.application.siteWizard', this.get('projectSite'));
					this.set('projectSite', null);
					Em.RSVP.all([itemsPromise, extractorsPromise]).then(function() {
  			  			this.transitionToRoute('project', { id: newProjectName });
					}.bind(this)) 
				}.bind(this));
			}.bind(this));
		},

		showProjectRevisions: function(projectName) {
			this.get('slyd').projectRevisions(projectName).then(function(revisions) {
				this.get('projectRevisions')[projectName] = revisions['revisions'];
				this.notifyPropertyChange('projectRevisions');
			}.bind(this));
		},

		hideProjectRevisions: function(projectName) {
			delete this.get('projectRevisions')[projectName];
			this.notifyPropertyChange('projectRevisions');
		},
	},

	animateProjectSiteInput: function() {
		var animateBorderColor = function () {
			$('#projectSiteTextField')
				.animate({ 'border-color': 'rgba(88,150,220,0.4)', 'background-color': 'rgba(130,210,230,0.1)' }, 1000)
				.animate({ 'border-color': '#BBBBB', 'background-color': '#FFFFFF' }, 1000, animateBorderColor)
		};
		Em.run.schedule('afterRender', this, function() {
			$('#projectSiteTextField')
				.hide()
				.show('fast', animateBorderColor)
				.click(function(e) {
					$('#projectSiteTextField').stop(true)
					.css({ 'border-color': '#BBBBB', 'background-color': '#FFFFFF' });
				});
		});
	},

	willEnter: function() {
		this.get('documentView').showSpider();
		if (Em.isEmpty(this.get('content'))) {
			this.animateProjectSiteInput();	
		}
	}
});
