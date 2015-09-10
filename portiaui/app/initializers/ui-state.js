export function initialize(container, application) {
    application.inject('service:ui-state', 'router', 'router:main');
    application.inject('service:ui-state',
        'spiderRoute', 'route:projects/project/spider');
    application.inject('service:ui-state',
        'sampleRoute', 'route:projects/project/spider/sample');
    application.inject('service:ui-state',
        'annotationRoute', 'route:projects/project/spider/sample/annotation');
    application.inject('service:ui-state',
        'schemaRoute', 'route:projects/project/schema');
}

export default {
    name: 'ui-state',
    initialize: initialize
};
