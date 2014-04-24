ASTool.BaseControllerMixin = Ember.Mixin.create({

	openAccordion: function(accordionNumber) {
		$( ".accordion" ).accordion("option", "active", accordionNumber);
	},

	getUnusedName: function(baseName, usedNames) {
		var i = 1;
		var newName = baseName;
		while(usedNames.any(function(usedName) {
			return usedName == newName
		})) {
			newName = baseName + '_' + i++;
		}
		return newName;
	},

	versionControlBinding: 'slyd.server_capabilities.version_control',
});
