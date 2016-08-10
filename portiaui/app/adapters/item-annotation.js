import SlydJSONAPIAdapter from '../utils/adapter';

export default SlydJSONAPIAdapter.extend({
    urlTemplate: '{+host}/api/projects/{item_sample_spider_project_id}/spiders' +
                 '/{item_sample_spider_id}/samples/{item_sample_id}/item_annotations{/id}'
});
