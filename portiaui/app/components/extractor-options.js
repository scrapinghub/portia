import Ember from 'ember';
import { FIELD_TYPES } from '../models/field';

export default Ember.Component.extend({
    dispatcher: Ember.inject.service(),

    tagName: '',

    annotation: null,
    types: FIELD_TYPES,

    project: Ember.computed.readOnly('annotation.parent.sample.spider.project'),
    regexExtractors: Ember.computed.filterBy('project.extractors', 'type', 'regex'),

    actions: {
        save() {
            this.get('annotation').save();
        },

        addTypeExtractor(type) {
            const annotation = this.get('annotation');
            this.get('dispatcher').addAnnotationTypeExtractor(annotation, type);
        },

        addRegexExtractor(extractor) {
            const annotation = this.get('annotation');
            this.get('dispatcher').addAnnotationRegexExtractor(annotation, extractor);
        },

        addNewRegexExtractor() {
            const annotation = this.get('annotation');
            this.get('dispatcher').addNewAnnotationRegexExtractor(annotation);
        },

        removeExtractor(extractor) {
            const annotation = this.get('annotation');
            this.get('dispatcher').removeAnnotationExtractor(annotation, extractor);
        },

        saveExtractor(extractor) {
            extractor.save().then(null, () => {
                extractor.rollbackAttributes();
            });
        }
    }
});
