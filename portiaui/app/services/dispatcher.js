import Ember from 'ember';
import Sample from '../models/sample';
import { includesUrl } from '../utils/start-urls';
import buildStartUrl from '../models/start-url';
import {createStructure} from './annotation-structure';
import {getDefaultAttribute} from '../components/inspector-panel';
import {updateStructureSelectors} from '../services/annotation-structure';
import { task } from 'ember-concurrency';

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

export default Ember.Service.extend({
    api: Ember.inject.service(),
    browser: Ember.inject.service(),
    routing: Ember.inject.service('-routing'),
    selectorMatcher: Ember.inject.service(),
    store: Ember.inject.service(),
    uiState: Ember.inject.service(),
    webSocket: Ember.inject.service(),

    addProject(name, redirect = false) {
        const store = this.get('store');
        const project = store.createRecord('project', {
            name,
        });
        return project.save().then(() => {
            if (redirect) {
                const routing = this.get('routing');
                routing.transitionTo('projects.project', [project], {}, true);
            }
            return project;
        });
    },

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

    addSpider(project, redirect = false) {
        const url = this.get('browser.url');
        if (!url) {
            return;
        }
        let name = url;
        const matches = url.match('//([a-zA-Z0-9\._-]*)');
        const store = this.get('store');
        if (matches && matches.length) {
            name = matches.slice(-1)[0];
        } else {
            name = url.replace(/[^a-zA-Z0-9_\.-]/g, '');
        }
        let baseName = name;
        let counter = 1;
        while (store.peekRecord('spider', name)) {
            name = `${baseName}_${counter}`;
            counter += 1;
        }
        const spider = store.createRecord('spider', {
            id: name,
            startUrls: [buildStartUrl({ url: url })],
            project
        });
        spider.set('project', project);
        spider.save().then(() => {
            if (redirect) {
                spider.set('new', true);
                const routing = this.get('routing');
                routing.transitionTo('projects.project.spider', [spider], {}, true);
            }
        });
        return spider;
    },

    addStartUrl(spider, url) {
        if (url && !includesUrl(spider, url)) {
            return buildStartUrl({ url: url }).save(spider);
        }
    },

    addGeneratedUrl(spider, url) {
        let spec = { type: 'generated' };

        if (!url || includesUrl(spider, url)) {
            spec.url = 'http://';
            return buildStartUrl(spec).save(spider);
        }
        if (!includesUrl(spider, url)) {
            spec.url = url;
            return buildStartUrl(spec).save(spider);
        }
    },

    addFeedUrl(spider, url) {
        return buildStartUrl({ url: url, type: 'feed' }).save(spider);
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
            body: 'original_body',
            url,
            spider
        });
        sample.save().then(() => {
            this.get('webSocket')._sendPromise({
                _command: 'save_html',
                project: spider.get('project.id'),
                spider: spider.get('id'),
                sample: sample.get('id')
            }).then(() => {
                if (redirect) {
                    sample.set('new', true);
                    const routing = this.get('routing');
                    routing.transitionTo('projects.project.spider.sample', [sample], {}, true);
                }
            });
        });
        return sample;
    },

    addItem(sample, redirect = false) {
        return this._addItem({
            sample
        }, redirect);
    },

    addNestedItem(parentItem, redirect = false) {
        return this._addItem({
            parent: parentItem
        }, redirect);
    },

    _addItem(attributes, redirect = false) {
        const store = this.get('store');
        const item = store.createRecord('item', attributes);
        this.saveAnnotationAndRelatedSelectors(item).then(() => {
            if (redirect) {
                item.set('new', true);
                const routing = this.get('routing');
                routing.transitionTo('projects.project.spider.sample.data.item', [item], {}, true);
            }
        });
        return item;
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
        this.saveAnnotationAndRelatedSelectors(annotation).then(() => {
            if (redirect) {
                annotation.set('new', true);
            }
            if (element) {
                this.selectAnnotationElement(annotation, element, redirect);
            } else if (redirect) {
                this.selectAnnotation(annotation);
            }
        });
        return annotation;
    },

    saveAnnotationAndRelatedSelectors(annotation) {
        if (!annotation.get('ownerSample')) {
          return new Ember.RSVP.Promise.resolve();
        }

        return annotation.get('ownerSample').then(sample =>
            this.updateSampleSelectors(sample).then(() => {
                const coalesce = [];
                for (let child of sample.get('orderedChildren')) {
                    if (child === annotation) {
                        continue;
                    }
                    if (child.constructor.modelName === 'item') {
                        coalesce.push({
                            model: child,
                            options: {
                                partial: ['selector', 'repeatedSelector', 'siblings']
                            }
                        });
                    } else if (child.constructor.modelName === 'annotation') {
                        coalesce.push({
                            model: child,
                            options: {
                                partial: ['selectionMode', 'selector', 'xpath']
                            }
                        });
                    }
                }

                return annotation.save(coalesce.length ? {
                    coalesce
                } : undefined);
            }));
    },

    addAnnotationTypeExtractor(annotation, type) {
        const store = this.get('store');
        const project = annotation.get('ownerSample.spider.project');
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
        const project = annotation.get('ownerSample.spider.project');
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

    changeId(model, json) {
        // HACK: Ember data does not support changing a record's id
        // This mechanism bypasses this contraint.

        const store = this.get('store');

        let internalModel = model._internalModel;
        const newId = json.data.id;

        // Update internal store with internal model
        const recordMap = store.typeMapFor(internalModel.type).idToRecord;
        delete recordMap[internalModel.id];
        recordMap[newId] = internalModel;

        // Allows changing ED model id
        internalModel.id = newId;
        // Allows adapters to infer the correct url
        internalModel._links.self = json.data.links.self;

        model.set('id', newId);
    },

    changeSpiderName(spider) {
        if (!spider.get('name') || spider.get('name') === spider.get('id')) {
            return new Ember.RSVP.Promise(resolve => resolve({
                data: {
                    links: {self: spider._internalModel._links.self},
                    id: spider.get('id')
            }}));
        }
        const data = { name: spider.get('name') };
        return this.get('api').post('rename', {
            model: spider,
            jsonData: data
        });
    },

    changeAnnotationSource(annotation, attribute) {
        if (annotation) {
            annotation.set('attribute', attribute);
            annotation.save();
        }
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

    replaceStartUrl(spider, oldUrl, newUrl) {
        const urls = spider.get('startUrls');

        let oldStartUrl = urls.filterBy('url', oldUrl)[0];
        urls.removeObject(oldStartUrl);

        if (!includesUrl(spider, newUrl)) {
            urls.addObject(buildStartUrl({url: newUrl, type: 'url'}));
        }
        spider.save();
    },

    removeSample(sample) {
        const currentSample = this.get('uiState.models.sample');
        if (sample === currentSample) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider', [], {}, true);
        }
        sample.destroyRecord();
    },

    removeItem(item) {
        const currentItem = this.get('uiState.models.item');
        const currentAnnotation = this.get('uiState.models.annotation');
        if (item === currentItem || item.get('orderedAnnotations').includes(currentAnnotation)) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample.data', [], {}, true);
        }
        item.deleteRecord();
        this.saveAnnotationAndRelatedSelectors(item);
    },

    removeAnnotation(annotation) {
        this.get('_removeAnnotationTask').perform(annotation);
    },

    _removeAnnotationTask: task(function * (annotation) {
        const currentAnnotation = this.get('uiState.models.annotation');
        if (annotation === currentAnnotation) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample.data', [], {}, true);
        }
        annotation.deleteRecord();
        yield this.saveAnnotationAndRelatedSelectors(annotation);
    }).drop(),

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
        this.saveAnnotationAndRelatedSelectors(annotation).then(() => {
            this.selectAnnotationElement(annotation, element);
        });
    },

    removeElementFromAnnotation(annotation, element) {
        annotation.removeElement(element);
        this.selectAnnotation(annotation);
        this.saveAnnotationAndRelatedSelectors(annotation);
    },

    updateSampleSelectors(sample) {
        const selectorMatcher = this.get('selectorMatcher');
        return createStructure(sample).then(structure => {
            updateStructureSelectors(structure, selectorMatcher);
            return null;
        });
    }
});
