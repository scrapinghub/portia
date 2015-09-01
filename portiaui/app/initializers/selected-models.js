export function initialize(container, application) {
    application.inject('service:selected-models', 'router', 'router:main');
    application.inject('service:selected-models',
        'spiderRoute', 'route:projects/project/spider');
    application.inject('service:selected-models',
        'sampleRoute', 'route:projects/project/spider/sample');
    application.inject('service:selected-models',
        'annotationRoute', 'route:projects/project/spider/sample/annotation');
    application.inject('service:selected-models',
        'schemaRoute', 'route:projects/project/schema');
}

export default {
    name: 'selected-models',
    initialize: initialize
};
