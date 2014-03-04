ASTool.ProjectsIndexController = Em.ArrayController.extend(ASTool.BaseControllerMixin, {
	needs: ['application'],

	projectSite: null,

	createProjectDisabled: function() {
		return Em.isEmpty(this.get('projectSite'));
	}.property('projectSite'),

	actions: {
		
		openProject: function(projectName) {
			this.set('slyd.project', projectName);
			this.transitionToRoute('project', { id: projectName });
		},

		deleteProject: function(projectName) {
			if (confirm('Are you sure you want to delete this project? This operation cannot be undone.')) {
				this.get('slyd').deleteProject(projectName);
				this.removeObject(projectName);
			} 
		},

		createProject: function() {
			var siteUrl = this.get('projectSite');
			if (siteUrl.indexOf('http') != 0) {
				siteUrl = 'http://' + siteUrl;
			}
			var parsedUrl = URI.parse(siteUrl);
			var newProjectName = parsedUrl.hostname;
			var i = 1;
			while(this.content.any(function(projectName){ return projectName == newProjectName})) {
				newProjectName = parsedUrl.hostname + '_' + i++;
			}
			this.get('slyd').createProject(newProjectName).then(function() {
				this.set('slyd.project', newProjectName);
				this.get('slyd').saveItems([
					ASTool.Item.create({ name: 'default', fields: [
						ASTool.ItemField.create({ name: 'image', required: false, type: "image", vary: false }),
						ASTool.ItemField.create({ name: 'text', required: false, type: "text", vary: false }),
						ASTool.ItemField.create({ name: 'link', required: false, type: "url", vary: false }) ]
					})
				]);
				// Initialize extractors spec.
				this.get('slyd').saveExtractors([]);
				// Setup automatic creation of an initial spider.
				if (this.get('projectSite')) {
					this.set('controllers.application.newSpiderSite', this.get('projectSite'));
					this.set('projectSite', null);
				}
				this.transitionToRoute('project', { id: newProjectName });
			}.bind(this));
		}
	},

	willEnter: function() {
		this.get('documentView').showSpider();
	}
});
