import { createAdapter } from '../utils/adapter';

export default createAdapter({
    buildURL: function(type, id, snapshot) {
        return '/projects/' + snapshot.record.get('project.id') + '/spec/spiders/' + id;
    }
});
