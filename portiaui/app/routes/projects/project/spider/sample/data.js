import Ember from 'ember';
const { inject: { service }, run } = Ember;

export default Ember.Route.extend({
    annotationStructure: service(),
    extractedItems: service(),
    browser: service(),

    init() {
        this._super(...arguments);
        this.scheduledRenderOverlays = null;
    },

    model() {
        return this.modelFor('projects.project.spider.sample');
    },

    afterModel(model) {
        this.updateDataStructure(model);
        this.get('extractedItems').update();
    },

    activate() {
        this.get('browser').setAnnotationMode();
        this.controllerFor('projects.project').setClickHandler(this.viewPortClick.bind(this));
    },

    deactivate() {
        this.updateDataStructure(null);

        if (this.scheduledRenderOverlays) {
            run.cancel(this.scheduledRenderOverlays);
        }

        this.get('browser').clearAnnotationMode();
        this.controllerFor('projects.project').clearClickHandler();
    },

    renderTemplate() {
        this.render('projects/project/spider/sample/data/structure', {
            into: 'projects/project/spider/sample/structure',
            outlet: 'sample-structure'
        });

        this.render('projects/project/spider/sample/data/tools', {
            into: 'tool-panels',
            outlet: 'tool-panels'
        });

        this.render('projects/project/spider/sample/data/toolbar', {
            into: 'projects/project/spider/sample/toolbar',
            outlet: 'browser-toolbar'
        });

        this.scheduledRenderOverlays = run.next(this, this.renderOverlayTemplate);
    },

    renderOverlayTemplate() {
        this.scheduledRenderOverlays = null;
        this.render('projects/project/spider/sample/data/overlays', {
            into: 'projects/project',
            outlet: 'browser-overlays'
        });
    },

    updateDataStructure(model) {
        const annotationStructure = this.get('annotationStructure');
        const currentModel = this._dataStructureModel;

        if (currentModel !== model) {
            annotationStructure.removeDataStructure(currentModel);
            annotationStructure.addDataStructure(model);
            this._dataStructureModel = model;
        }
    },

    viewPortClick() {
        this.get('controller').send('selectElement', ...arguments);
    }
});
