import { createAdapter } from '../utils/adapter';

export default createAdapter({
    urlTemplate: '{+host}/api/projects/{project_id}/extractors{/id}'
});
