import Ember from 'ember';
import Sample from '../models/sample';
import ItemAnnotation from '../models/item-annotation';
import {getDefaultAttribute} from '../components/inspector-panel';

export function computedCanAddSpider() {
    return Ember.computed('browser.url', function() {
        return this.get('browser.url');
    });
}

export function computedCanAddSample(spiderPropertyName) {
    return Ember.computed('browser.url', `${spiderPropertyName}.samples.@each.url`,
                          'browser.loading', function() {
        const url = this.get('browser.url');
        return (url && !this.get('browser.loading') &&
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
        field.save().then(() => {
            if (redirect) {
                field.set('new', true);
                const routing = this.get('routing');
                routing.transitionTo('projects.project.schema.field', [field], {}, true);
            }
        });
        return field;
    },

    addSpider(project, redirect = false) {
        const url = this.get('browser.url');
        if (!url) {
            return;
        }

        const store = this.get('store');
        const spider = store.createRecord('spider', {
            name: url.match('//([a-zA-Z0-9\._-]*)').slice(-1)[0],
            startUrls: [url],
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
        const urls = spider.get('startUrls');
        if (url && !urls.includes(url)) {
            urls.pushObject(url);
            spider.save();
            return url;
        }
    },

    addSample(spider, redirect = false) {
        const url = this.get('browser.url');
        if (!url) {
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

    changeAnnotationSource(annotation, attribute) {
        if (annotation) {
            annotation.set('attribute', attribute);
            annotation.save();
        }
    },

    changeItemSchema(item, schema) {
        const fieldsMap = new Map(
            schema.get('fields').map(field => [field.get('name'), field]));

        let annotationsToMigrate = [];
        item.get('annotations').forEach((annotation) => {
            if (annotation instanceof ItemAnnotation) {
                return;
            }
            const name = annotation.get('name');
            const type = annotation.get('type');
            let field = fieldsMap.get(name);
            if (field && field.get('type') === type) {
                let newAnnotation = annotation.toJSON();
                newAnnotation.parent = item;
                newAnnotation.field = field;
                newAnnotation.extractors = annotation.get('extractors');
                annotationsToMigrate.push(newAnnotation);
                this.removeAnnotation(annotation);
            }
        });

        item.set('schema', schema);
        item.save().then(() => {
            annotationsToMigrate.forEach(newAnnotation => {
                newAnnotation = this.get('store').createRecord('annotation', newAnnotation);
                newAnnotation.save();
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

    replaceStartUrl(spider, oldUrl, newUrl) {
        const urls = spider.get('startUrls');
        urls.removeObject(oldUrl);
        urls.addObject(newUrl);
        spider.save();
    },

    deleteAutoCreatedSchema(sample) {
        if(sample.get('_autoCreatedSchema')) {
            this.get('store').findRecord('schema', sample.get('_autoCreatedSchema'), {reload: true})
                .then(s => this.removeSchema(s));
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
