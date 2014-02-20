ASTool.ProjectsController = Em.ArrayController.extend(ASTool.RouteBrowseMixin, {
	needs: ['application'],

	projectSite: null,

	actions: {
		
		openProject: function(projectName) {
			this.set('slyd.project', projectName);
			this.pushRoute('project', projectName, 'fade', projectName);
		},

		deleteProject: function(projectName) {
			if (confirm('Are you sure you want to delete this project? This operation cannot be undone.')) {
				this.get('slyd').deleteProject(projectName);
				this.removeObject(projectName);
			} 
		},

		createProject: function() {
			var newProjectName = 'new_project_';
			var i = 1;
			while(this.content.any(function(projectName){ return projectName == newProjectName + i })) {
				i++;
			}
			newProjectName += i;			
			this.get('slyd').createProject(newProjectName).then(function() {
				this.set('slyd.project', newProjectName);
				this.get('slyd').saveItems([
					ASTool.Item.create({ name: 'default', fields: [
						{ name: 'image', required: false, type: "image", vary: false },
						{ name: 'text', required: false, type: "text", vary: false },
						{ name: 'link', required: false, type: "url", vary: false } ]
					})
				]);
				// Initialize extractors spec.
				this.get('slyd').saveExtractors([]);
				// Setup automatic creation of an initial spider.
				if (this.get('projectSite')) {
					this.set('controllers.application.newSpiderSite', this.get('projectSite'));
					this.set('projectSite', null);
				}
				this.pushRoute('project', newProjectName, 'fade', newProjectName);
			}.bind(this));
		}
	},

	willEnter: function() {
		this.get('documentView').showSpider();
	}
});
