import Ember from 'ember';

export default Ember.Object.create({
    // Inline help messages.
    overlay_blocked_links: 'Enable this options to highlight links not followed at crawl time in red and followed links in green.',
    follow_links: 'Links that match any of the regular expressions in this list will be followed (they should also be in the same domain of one of the start pages).',
    exclude_links: 'Links that match any of the regular expressions in this list will be excluded.',
    perform_login: 'Select this option if the site you are crawling requires login credentials.',
    template_required: 'This setting is equivalent to marking the fields as required in the item definition, but limiting the scope to this sample only. <div class="alert alert-info"><span class="fa fa-icon fa-info-circle"></span> Only extracted fields can be set as required.</div>',
    extractors: 'With <b>regular expression extractors</b>, the extracted data is matched against the specified expression and replaced by the match group enclosed between parentheses. If there is no match, the field is not extracted.<br/><br/><b>Type extractors</b> override the type specified in the item definition.',
    select_item: 'You can choose what item type is extracted by this sample using the combobox. You can also create and modify items by clicking on the Edit Items button.',
    variant: 'By selecting a different variant than <b>Base(0)</b> in your annotation, the resulting extracted data will be assigned to the base item special field variants, which is a list of objects similar to an item.',
    ignored_subregions: 'Allows you to define subregions that should be excluded from the extraction process.',
    selected_region_ancestors: 'Refine your selection by navigating its ancestors.',
    selected_region_children: 'Refine your selection by navigating its children.',
    sticky_fields: 'Required attributes are not extracted, but they must be present for a page to match the sample.',
    annotation_widget: 'Select the attribute you want to extract and an item field to map it. <br/><br/>Choose <b>-just required-</b> to indicate that the sample must match a particular feature without generating any extracted data. <br/><br/> You can create new fields by clicking the <b>+ field button</b> or by seleting the <b>-create new-</b> option from the <b>field</b> combobox.',
    enable_js: 'Some sites may need JavaScript enabled for data to be extracted.<br>Enable this option to allow JavaScript to run on pages while crawling.<br>If you are unsure if you require JavaScript try creating a sample without enabling this option. If the data you want is visible you may not need to enable this option.',
    enable_js_for_links: 'JavaScript will be run on pages matching the patterns below before data and links are extracted.',
    disable_js_for_links: 'Only raw HTML will be fetched for pages matching the patterns below.',
    // Other messages.
    confirm_change_selection: 'If you select a different region you will lose all current attribute mappings and ignored subregions, proceed anyway?',
    no_items_extracted: 'No items were extracted',
    publish_ok: 'The project was successfully published.',
    publish_ok_schedule: 'The project was successfully published. Do you want to be redirected to the schedule page?',
    deploy_ok: 'The project was successfully deployed.',
    deploy_ok_schedule: 'The project was successfully deployed. Do you want to be redirected to the schedule page?',
    publish_conflict: 'Another user has made changes to this project which conflict with your changes. You will need to manually resolve these conflicts',
    conflicts_solved: 'You have resolved all conflicts, your changes have been published.',
});