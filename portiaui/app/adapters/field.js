import SlydJSONAPIAdapter from '../utils/adapter';

export default SlydJSONAPIAdapter.extend({
    urlTemplate: '{+host}/api/projects/{schema_project_id}/schemas/{schema_id}/fields{/id}'
});
