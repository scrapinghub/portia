ASTool.Messages = Ember.Namespace.create({
	overlay_blocked_links: 'With this option enabled, links that will not be followed at crawl time will be highlighted in red while the ones that will be followed will be highlighted in gree.',
	follow_links: 'Links that match any of the regular expressions in this list will be followed (they should also be inside the domain of one of the start URLs).',
	exclude_links: 'Links that match any of the regular expressions in this list will be excluded.',
	perform_login: 'Select this option if the site you are crawling requires login credentials.',
	template_required: 'This setting is equivalent to marking the fields as required in the item definition, but limiting the scope to this template only.',
	extractors: 'Write a description of how extractos work here....',
	select_item: 'You can choose what item type is extracted by this template using the combobox. You can also create and modify items by clicking on the Edit Items button.',
	variant: 'Describe how variants work here.',
	ignored_subregions: 'Describe ignored subregions here.',
	selected_region_ancestors: 'Refine your selection by navigating its ancestors.',
	selected_region_children: 'Refine your selection by navigating its children.',
	sticky_fields: 'Required attributes are not extracted, but they must be present for a page to match the template.',

});