import Ember from 'ember';

export default Ember.Route.extend({
    annotationStructure: Ember.inject.service(),
    browser: Ember.inject.service(),

    init() {
        this._super(...arguments);
        this.scheduledRenderOverlays = null;
    },

    model() {
        return this.modelFor('projects.project.spider.sample');
    },

    afterModel(model) {
        this.updateDataStructure(model);
    },

    activate() {
        this.get('browser').setAnnotationMode();
        this.controllerFor('projects.project').setClickHandler(this.viewPortClick.bind(this));
    },

    deactivate() {
        this.updateDataStructure(null);

        if (this.scheduledRenderOverlays) {
            Ember.run.cancel(this.scheduledRenderOverlays);
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

        this.scheduledRenderOverlays = Ember.run.next(this, this.renderOverlayTemplate);
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
