import ApplicationAdapter from './application';

export default ApplicationAdapter.extend({
    urlTemplate: '{+host}/api/projects{/id}',
    findRecordUrlTemplate: '{+host}/api/projects{/id}',
    createRecordUrlTemplate: '{+host}/api/projects',
    shouldReloadRecord() { return true; }
});
