import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
    urlTemplate: '{+host}/api/projects/{project_id}/spiders/{spider_id}/samples/'+
                 '{sample_id}/item_annotations{/id}'
});
