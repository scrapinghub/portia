import SlydJSONAPIAdapter from '../utils/adapter';

export default SlydJSONAPIAdapter.extend({
    urlTemplate: '{+host}/api/projects/{project_id}/spiders/{spider_id}/samples{/id}'
});
