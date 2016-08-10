import SlydJSONAPIAdapter from '../utils/adapter';

export default SlydJSONAPIAdapter.extend({
    urlTemplate: '{+host}/api/projects/{project_id}/schemas{/id}'
});
