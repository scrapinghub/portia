import SimpleModel from './simple-model';

export default SimpleModel.extend({
    serializedProperties: ['page_id', 'default', 'scrapes', 'page_type', 'url',
        'annotations', 'extractors', 'name', 'plugins'],
    page_id: '',
    scrapes: 'default',
    page_type: 'item',
    url: '',
    annotated_body: '',
    original_body: '',
    _new: false,
    extractors: null,
});
