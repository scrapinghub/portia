import SlydJSONAPIAdapter from '../utils/adapter';

export default SlydJSONAPIAdapter.extend({
    urlTemplate: '{+host}/api/projects/{spider_project_id}/spiders/{spider_id}/samples{/id}'
});
