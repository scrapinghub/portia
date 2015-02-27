import SimpleModel from './simple-model';

export default SimpleModel.extend({
    serializedProperties: ['name', 'type', 'required', 'vary'],
    type: 'text',
    required: false,
    vary: false,
});
