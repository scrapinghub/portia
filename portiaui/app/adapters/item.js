import SlydJSONAPIAdapter from '../utils/adapter';

export default SlydJSONAPIAdapter.extend({
    urlTemplate: '{+host}/api/projects/{sample_spider_project_id}/spiders/{sample_spider_id}' +
                 '/samples/{sample_id}/items{/id}'
});
