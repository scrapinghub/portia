ASTool.ConflictsController = Em.ObjectController.extend(ASTool.BaseControllerMixin, {

	needs: ['application'],

	currentFileName: null,

	conflictedKeyPaths: {},

	conflictedFileNames: function() {
		return Object.keys(this.get('content')).sort();
	}.property('content'),

	currentFileContents: function() {
		return this.get('content')[this.get('currentFileName')];
	}.property('currentFileName'),

	getConflictedKeyPaths: function(content, parentPath) {
		if (toType(content) == 'object') {
			if ('__CONFLICT' in content) {
				return [parentPath];
			} else {
				var conflicted = [];
				Object.keys(content).forEach(function(key) {
					var path = parentPath ? parentPath + '.' + key : key;
					conflicted = conflicted.concat(this.getConflictedKeyPaths(content[key], path));
				}.bind(this));
				return conflicted;
			}
		}
		return [];
	},

	hasUnresolvedConflict: function() {
		var conflict = false;
		if (this.get('conflictedKeyPaths')) {
			conflict = Object.keys(this.get('conflictedKeyPaths')).any(function(key) {
					return !this.get('conflictedKeyPaths')[key];
			}, this);
		}
		return conflict;
	}.property('conflictedKeyPaths'),

	saveDisabled: function() {
		return this.get('hasUnresolvedConflict') || !this.get('currentFileName');
	}.property('hasUnresolvedConflict', 'currentFileName'),

	resolveContent: function(content, parentPath) {
		if (toType(content) == 'object') {
			if ('__CONFLICT' in content) {
				if (parentPath in this.get('conflictedKeyPaths')) {
					var option = this.get('conflictedKeyPaths')[parentPath];
					content = content['__CONFLICT'][option];
				}
			} else {
				Object.keys(content).forEach(function(key) {
					var path = parentPath ? parentPath + '.' + key : key;
					content[key] = this.resolveContent(content[key], path);
				}.bind(this));
			}
		}
		return content;
	},

	displayConflictedFile: function(fileName) {
		this.set('currentFileName', fileName);
		var conflictedPaths = this.getConflictedKeyPaths(this.get('currentFileContents'));
		conflictedPaths.forEach(function(path) {
			this.get('conflictedKeyPaths')[path] = '';
		}, this);
		this.notifyPropertyChange('conflictedKeyPaths');
	},

	actions: {

		displayConflictedFile: function(fileName) {
			this.displayConflictedFile(fileName);
		},

		conflictOptionSelected: function(path, option) {
			this.get('conflictedKeyPaths')[path] = option;
			this.notifyPropertyChange('conflictedKeyPaths');
		},

		saveFile: function(fileName) {
			this.get('slyd').saveFile(
				this.get('slyd.project'),
				fileName,
				this.resolveContent(this.get('content')[fileName])).then(
					function() {
						delete this.get('content')[fileName];
						this.notifyPropertyChange('content');
						this.set('conflictedKeyPaths', {});
						this.set('currentFileName', null);
						if (Em.isEmpty(this.get('conflictedFileNames'))) {
							this.get('slyd').publishProject(this.get('slyd.project'), true);
							this.showAlert('Save Successful', ASTool.Messages.get('conflicts_solved'));
							this.transitionToRoute('projects');
						} else {
							this.displayConflictedFile(this.get('conflictedFileNames')[0]);
						}
					}.bind(this),
					function(err) {
						this.showHTTPAlert('Conflict Resolution Error', err);
					}.bind(this)
				).then(function() { }, function(err) {
					this.showHTTPAlert('Save Error', err);
				}.bind(this));
		},

		publish: function() {
			this.get('slyd').publishProject(this.get('slyd.project'), true).then(
				function() { }, function(err) {
					this.showHTTPAlert('Publish Error', err);
				}.bind(this)
			);
		},
	},

	willEnter: function() {
		if (!Em.isEmpty(this.get('conflictedFileNames'))) {
			this.displayConflictedFile(this.get('conflictedFileNames')[0]);
		}
	},
});