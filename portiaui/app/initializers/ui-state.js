export function initialize(application) {
    application.inject('service:ui-state', 'router', 'router:main');
    application.inject('service:ui-state',
        'projectRoute', 'route:projects/project');
    application.inject('service:ui-state',
        'spiderRoute', 'route:projects/project/spider');
    application.inject('service:ui-state',
        'sampleRoute', 'route:projects/project/spider/sample');
    application.inject('service:ui-state',
        'dataRoute', 'route:projects/project/spider/sample/data');
    application.inject('service:ui-state',
        'itemRoute', 'route:projects/project/spider/sample/data/item');
    application.inject('service:ui-state',
        'annotationRoute', 'route:projects/project/spider/sample/data/annotation');
    application.inject('service:ui-state',
        'schemaRoute', 'route:projects/project/schema');
    application.inject('service:ui-state',
        'fieldRoute', 'route:projects/project/schema/field');
}

export default {
    name: 'ui-state',
    initialize: initialize
};
