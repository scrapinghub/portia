ASTool.ProjectsController = Em.ArrayController.extend(ASTool.RouteBrowseMixin, {
	needs: ['application'],

	actions: {
		
		openProject: function(projectName) {
			this.pushRoute('project', 'Project: ' + projectName, 'fade', projectName);
		},

		deleteProject: function(projectName) {
			this.get('slyd').deleteProject(projectName);
			this.removeObject(projectName);
		},

		createProject: function() {
			var projectName = 'new_project';
			this.get('slyd').createProject(projectName).then(function() {
				this.pushRoute('project', 'Project: ' + projectName, 'fade', projectName);
			}.bind(this));
		}
	},
});
