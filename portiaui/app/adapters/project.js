import { createAdapter } from '../utils/adapter';

export default createAdapter({
    buildURL: function(type, id) {
        return '/projects' + (id ? '/'+id : '');
    }
});
