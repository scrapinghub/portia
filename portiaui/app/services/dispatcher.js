import Ember from 'ember';
import Sample from '../models/sample';
import ItemAnnotation from '../models/item-annotation';
import { getDefaultAttribute } from '../components/inspector-panel';
import { includesUrl } from '../utils/start-urls';
import startUrl from '../models/start-url';

export function computedCanAddSpider() {
    return Ember.computed('browser.url', function() {
        return this.get('browser.url');
    });
}

export function computedCanAddSample(spiderPropertyName) {
    return Ember.computed('browser.url', 'browser.document', 'browser.loading',
                          `${spiderPropertyName}.samples.@each.url`,
                          'browser.loading', function() {
        const url = this.get('browser.url');
        const document = this.get('browser.document');
        const loading = this.get('browser.loading');
        return (url && document && !loading &&
                !this.get(`${spiderPropertyName}.samples`).isAny('url', url));
    });
}

export function computedEditableSample(spiderPropertyName) {
    return Ember.computed('browser.url', `${spiderPropertyName}.samples.@each.url`, function() {
        const url = this.get('browser.url');
        if (!url) {
            return;
        }
        return this.get(`${spiderPropertyName}.samples`).findBy('url', url);
    });
}

export function computedCanAddStartUrl(spiderPropertyName) {
    return Ember.computed('browser.url', `${spiderPropertyName}.startUrls.[]`, function() {
        const url = this.get('browser.url');
        return url && !this.get(`${spiderPropertyName}.startUrls`).includes(url);
    });
}

export default Ember.Service.extend({
    browser: Ember.inject.service(),
    routing: Ember.inject.service('-routing'),
    store: Ember.inject.service(),
    uiState: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    addSchema(project, redirect = false) {
        const name = `schema${project.get('schemas.length') + 1}`;
        return this.addNamedSchema(project, name, redirect);
    },

    addNamedSchema(project, name, redirect = false) {
        const store = this.get('store');
        const schema = store.createRecord('schema', {
            name,
            project
        });
        return schema.save().then(() => {
            if (redirect) {
                schema.set('new', true);
                const routing = this.get('routing');
                routing.transitionTo('projects.project.schema', [schema], {}, true);
            }
            return schema;
        });
    },

    addField(schema, type, redirect = false) {
        const name = `field${schema.get('fields.length') + 1}`;
        return this.addNamedField(schema, name, type, redirect);
    },

    addNamedField(schema, name, type, redirect = false) {
        const store = this.get('store');
        const field = store.createRecord('field', {
            name,
            type: type || 'text',
            schema
        });
        return field.save().then((field) => {
            if (redirect) {
                field.set('new', true);
                const routing = this.get('routing');
                routing.transitionTo('projects.project.schema.field', [field], {}, true);
            }
            return field;
        });
    },

    addStartUrl(spider, url) {
        if (url && !includesUrl(spider, url)) {
            return startUrl({ url: url }).save(spider);
        }
    },

    addGeneratedUrl(spider, url) {
        let spec = { type: 'generated' };

        if (!url || includesUrl(spider, url)) {
            spec.url = 'http://';
            return startUrl(spec).save(spider);
        }
        if (!includesUrl(spider, url)) {
            spec.url = url;
            return startUrl(spec).save(spider);
        }
    },

    addSample(spider, redirect = false) {
        const url = this.get('browser.url');
        const document = this.get('browser.document');
        const loading = this.get('browser.loading');
        if (!url || !document || loading) {
            return;
        }

        const store = this.get('store');
        const name = Sample.normalizeTitle(this.get('browser.document').title);
        const sample = store.createRecord('sample', {
            name,
            url,
            spider
        });
        sample.save().then(() => {
            this.get('webSocket')._sendPromise({
                _command: 'save_html',
                project: spider.get('project.id'),
                spider: spider.get('id'),
                sample: sample.get('id')
            });

            if (redirect) {
                sample.set('_autoCreatedSchema', sample.get('scrapes'));
                sample.set('new', true);
                const routing = this.get('routing');
                routing.transitionTo('projects.project.spider.sample', [spider, sample], {}, true);
            }
        });
        return sample;
    },

    addItem(sample, redirect = false) {
        const store = this.get('store');
        const schema = store.createRecord('schema', {
            name: sample.get('name'),
            project: sample.get('spider.project')
        });
        const item = store.createRecord('item', {
            sample
        });
        schema.save().then(() => {
            item.set('schema', schema);
            item.save();
            if (redirect) {
                item.set('new', true);
            }
        });
        return item;
    },

    addItemAnnotation(item /*, redirect = false */) {
        const store = this.get('store');
        const project = item.get('schema.project');
        const sample =  item.get('sample');
        const schema = store.createRecord('schema', {
            name: `schema${project.get('schemas.length') + 1}`,
            project
        });
        const newItem = store.createRecord('item', {
            name: `subitem${item.get('annotations.length') + 1}`,
            parent: item,
            sample
        });
        schema.save().then(() => {
            newItem.set('schema', schema);
            newItem.save();
        });
        return newItem;
    },

    addAnnotation(item, element, attribute, redirect = false) {
        if (!item) {
            let activeItem;
            let activeAnnotation;
            if (activeItem = this.get('uiState.models.item')) {
                item = activeItem;
            } else if (activeAnnotation = this.get('uiState.models.annotation')) {
                item = activeAnnotation.get('parent');
            } else {
                item = this.get('uiState.models.sample.items.lastObject');
            }
        }
        const store = this.get('store');
        const annotation = store.createRecord('annotation', {
            parent: item
        });
        if (element) {
            annotation.addElement(element);
            attribute = attribute || getDefaultAttribute(element);
        }

        if (attribute !== undefined) {
            annotation.set('attribute', attribute);
        }
        // FIXME: annotation.selector is null at this point
        annotation.save().then(() => {
            if (redirect) {
                annotation.set('new', true);
                annotation.get('field').then(f => {
                    if (!!f) {
                        annotation.set('_autoCreatedField', f);
                        f.set('_autoCreatedBy', annotation);
                    }
                });
            }
            if (element) {
                this.selectAnnotationElement(annotation, element, redirect);
            } else if (redirect) {
                this.selectAnnotation(annotation);
            }
        });
        return annotation;
    },

    addAnnotationTypeExtractor(annotation, type) {
        const store = this.get('store');
        const project = annotation.get('sample.spider.project');
        return project.get('extractors').then(extractors => {
            const existing = extractors.find(extractor => {
                return extractor.get('type') === 'type' && extractor.get('value') === type;
            });
            let extractorPromise;
            if (existing) {
                extractorPromise = Ember.RSVP.resolve(existing);
            } else {
                const extractor = store.createRecord('extractor', {
                    project,
                    type: 'type',
                    value: type
                });
                extractorPromise = extractor.save();
            }
            return extractorPromise.then(extractor => {
                annotation.get('extractors').pushObject(extractor);
                return annotation.save().then(() => extractor);
            });
        });
    },

    addAnnotationRegexExtractor(annotation, extractor) {
        annotation.get('extractors').pushObject(extractor);
        return annotation.save().then(() => extractor);
    },

    addNewAnnotationRegexExtractor(annotation) {
        const store = this.get('store');
        const project = annotation.get('sample.spider.project');
        const extractor = store.createRecord('extractor', {
            project,
            type: 'regex',
            value: '(.*)'
        });
        return extractor.save().then(extractor => {
            extractor.set('new', true);
            annotation.get('extractors').pushObject(extractor);
            return annotation.save().then(() => extractor);
        });
    },

    addFragment(startUrl) {
        let emptyFragment = { type: 'fixed', value: '' };
        startUrl.fragments.addObject(emptyFragment);
    },

    changeAnnotationSource(annotation, attribute) {
        if (annotation) {
            annotation.set('attribute', attribute);
            annotation.save();
        }
    },

    changeItemSchema(item, schema) {
        return schema.get('fields').then(fields => {
            const store = this.get('store');

            const fieldMap = {};
            fields.forEach(field => {
                fieldMap[field.get('name')] = field;
            });

            return item.get('annotations').then(allAnnotations => {
                const annotations = [];
                const promises = [];
                allAnnotations.forEach(annotation => {
                    if (annotation.constructor.modelName === 'annotation') {
                        promises.push(
                            annotation.get('field').then(field => {
                                const name = field.get('name');

                                annotations.push({
                                    annotation,
                                    fieldName: name
                                });

                                if (!(name in fieldMap)) {
                                    const newField = store.createRecord('field', {
                                        name,
                                        type: field.get('type'),
                                        schema
                                    });
                                    fieldMap[name] = newField;
                                    return newField.save();
                                }
                            }));
                    }
                });

                return Ember.RSVP.all(promises).then(() => {
                    for (let {annotation, fieldName} of annotations) {
                        annotation.set('field', fieldMap[fieldName]);
                    }

                    return item.get('itemAnnotation').then(itemAnnotation =>
                        itemAnnotation.save().then(() => {
                            item.set('schema', schema);
                            return item.save();
                        }));
                });
            });
        });
    },

    removeSchema(schema) {
        const currentSchema = this.get('uiState.models.schema');
        if (schema === currentSchema) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project', [], {}, true);
        }
        for (let field of schema.get('fields.content').currentState) {
            field.unloadRecord();
        }
        schema.destroyRecord();
    },

    removeField(field) {
        const currentField = this.get('uiState.models.field');
        if (field === currentField) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.schema', [], {}, true);
        }
        field.destroyRecord();
    },

    removeSpider(spider) {
        const currentSpider = this.get('uiState.models.spider');
        if (spider === currentSpider) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project', [], {}, true);
        }
        spider.destroyRecord();
    },

    removeStartUrl(spider, url) {
        spider.get('startUrls').removeObject(url);
        spider.save();
    },

    replaceStartUrl(spider, oldUrl, newUrl, startUrlObject) {
        const urls = spider.get('startUrls');
        urls.removeObject(startUrlObject);
        urls.addObject(startUrl({url: newUrl, isGenerated: startUrlObject.isGenerated}));
        spider.save();
    },

    deleteAutoCreatedSchema(sample) {
        if(sample.get('_autoCreatedSchema')) {
            const schema = this.get('store').peekRecord('schema', sample.get('_autoCreatedSchema'));
            this.removeSchema(schema);
            sample.set('_autoCreatedSchema', null);
        }
    },

    removeSample(sample) {
        const currentSample = this.get('uiState.models.sample');
        if (sample === currentSample) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider', [], {}, true);
        }
        for (let item of sample.get('items.content').currentState) {
            let itemAnnotation = item.record.get('itemAnnotation.content');
            let parent = item.record.get('parent.content');
            if (parent) {
                parent.unloadRecord();
            }
            for (let annotation of item.record.get('annotations.content').currentState) {
                annotation.record.unloadRecord();
            }
            itemAnnotation.unloadRecord();
            item.unloadRecord();
        }
        sample.destroyRecord().then(() => {
            this.deleteAutoCreatedSchema(sample);
        });
    },

    removeItem(item) {
        const currentAnnotation = this.get('uiState.models.annotation');
        if (item.get('orderedAnnotations').includes(currentAnnotation)) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample.data', [], {}, true);
        }
        const sample = item.get('sample');
        item.destroyRecord().then(() => {
            if (sample.get('items.length') === 0) {
                this.addItem(sample);
            }
        });
    },

    removeItemAnnotation(itemAnnotation) {
        const currentAnnotation = this.get('uiState.models.annotation'),
              parentItem = itemAnnotation.get('item.content');
        if (itemAnnotation.get('orderedAnnotations').includes(currentAnnotation)) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample.data', [], {}, true);
        }
        itemAnnotation.destroyRecord().then(() => parentItem.unloadRecord());
    },

    removeAnnotation(annotation) {
        const currentAnnotation = this.get('uiState.models.annotation');
        if (annotation === currentAnnotation) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample.data', [], {}, true);
        }
        annotation.destroyRecord();
    },

    removeAnnotationExtractor(annotation, extractor) {
        annotation.get('extractors').removeObject(extractor);
        annotation.save();
    },

    removeFragment(startUrl, fragment) {
        startUrl.fragments.removeObject(fragment);
    },

    selectAnnotation(annotation) {
        if (this.get('uiState.models.annotation') !== annotation) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample.data.annotation',
                [annotation], {}, true);
        }
    },

    selectAnnotationElement(annotation, element, redirect = false) {
        this.set('uiState.viewPort.selectedElement', element);
        this.set('uiState.viewPort.originalSelectedElement', element);
        this.set('uiState.viewPort.selectedModel', annotation);
        if (redirect) {
            this.selectAnnotation(annotation);
        }
    },

    clearSelection() {
        this.set('uiState.viewPort.selectedElement', null);
        this.set('uiState.viewPort.originalSelectedElement', null);
        const routing = this.get('routing');
        const currentRouteName = routing.get('router.currentRouteName');
        let nextRouteName;
        if (currentRouteName.startsWith('projects.project.spider.sample')) {
            nextRouteName = currentRouteName.split('.').slice(0, 5).join('.');
        } else {
            nextRouteName = 'projects.project.spider.sample';
        }
        routing.transitionTo(nextRouteName, [], {}, true);
    },

    addElementToAnnotation(annotation, element) {
        annotation.addElement(element);
        this.selectAnnotationElement(annotation, element);
        annotation.save();
    },

    removeElementFromAnnotation(annotation, element) {
        annotation.removeElement(element);
        this.selectAnnotation(annotation);
        annotation.save();
    }
});
