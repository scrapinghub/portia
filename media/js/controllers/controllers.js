ASTool.BaseControllerMixin = Ember.Mixin.create({
	openAccordion: function(accordionNumber) {
		$( ".accordion" ).accordion("option", "active", accordionNumber);
	},	
});
