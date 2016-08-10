import SlydJSONAPIAdapter from '../utils/adapter';

export default SlydJSONAPIAdapter.extend({
    urlTemplate: '{+host}/api/projects/{parent_sample_spider_project_id}/spiders' +
                 '/{parent_sample_spider_id}/samples/{parent_sample_id}/annotations{/id}'
});
