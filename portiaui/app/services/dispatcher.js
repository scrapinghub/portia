import Ember from 'ember';
import Sample from '../models/sample';
import ItemAnnotation from '../models/item-annotation';
import {getAttributeList} from '../components/inspector-panel';
import {uniquePathSelectorFromElement} from '../utils/selectors';


export function computedCanAddSpider() {
    return Ember.computed('browser.url', function() {
        return this.get('browser.url');
    });
}

export function computedCanAddSample(spiderPropertyName) {
    return Ember.computed('browser.url', `${spiderPropertyName}.samples.@each.url`, function() {
        const url = this.get('browser.url');
        return url && !this.get(`${spiderPropertyName}.samples`).isAny('url', url);
    });
}

export default Ember.Service.extend({
    browser: Ember.inject.service(),
    routing: Ember.inject.service('-routing'),
    store: Ember.inject.service(),
    uiState: Ember.inject.service(),

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
        schema.save().then(() => {
            if (redirect) {
                schema.set('new', true);
                const routing = this.get('routing');
                routing.transitionTo('projects.project.schema', [schema], {}, true);
            }
        });
        return schema;
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
            name: url,
            project,
            startUrls: [url]
        });
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
            const schema = store.createRecord('schema', {
                name,
                project: spider.get('project')
            });
            schema.save().then(() => {
                const item = store.createRecord('item', {
                    sample,
                    schema
                });
                item.save();
            });

            if (redirect) {
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

    addItemAnnotation(item, redirect = false) {
        const store = this.get('store');
        const project = item.get('schema.project');
        const schema = store.createRecord('schema', {
            name: `schema${project.get('schemas.length') + 1}`,
            project
        });
        const newItem = store.createRecord('item', {});
        const itemAnnotation = store.createRecord('item-annotation', {
            name: `subitem${item.get('annotations.length') + 1}`,
            parent: item
        });
        schema.save().then(() => {
            newItem.set('schema', schema);
            newItem.save().then(() => {
                itemAnnotation.set('item', newItem);
                itemAnnotation.save();
                if (redirect) {
                    itemAnnotation.set('new', true);
                }
            });
        });
        return itemAnnotation;
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
        const schema = item.get('schema');
        const field = store.createRecord('field', {
            name: `field${schema.get('fields.length') + 1}`,
            type: 'text',
            schema
        });
        if (element && element.tagName.toLowerCase() === 'img') {
            field.set('type', 'image');
        }
        const annotation = store.createRecord('annotation', {
            parent: item,
            acceptSelectors: element ? [uniquePathSelectorFromElement(element)] : []
        });
        if (attribute !== undefined) {
            annotation.set('attribute', attribute);
        } else if (element) {
            const attributes = getAttributeList(element);
            if (attributes.length === 1 && attributes[0].attribute) {
                annotation.set('attribute', attributes[0].attribute);
            }
        }
        field.save().then(() => {
            annotation.set('field', field);
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
        });
        return annotation;
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
        item.get('annotations').forEach(annotation => {
            if (annotation instanceof ItemAnnotation) {
                return;
            }

            const name = annotation.get('name');
            const type = annotation.get('type');
            let field = fieldsMap.get(name);
            if (field && field.get('type') === type) {
                annotation.set('field', field);
                annotation.save();
            } else {
                field = this.addField(schema, type, /*redirect = */false);
                field.save().then(() => {
                    annotation.set('field', field);
                    annotation.save();
                });
            }
        });
        item.set('schema', schema);
        item.save();
    },

    removeSchema(schema) {
        const currentSchema = this.get('uiState.models.schema');
        if (schema === currentSchema) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project', [], {}, true);
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

    removeSample(sample) {
        const currentSample = this.get('uiState.models.sample');
        if (sample === currentSample) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider', [], {}, true);
        }
        sample.destroyRecord();
    },

    removeItem(item) {
        const currentAnnotation = this.get('uiState.models.annotation');
        if (item.get('orderedAnnotations').includes(currentAnnotation)) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample', [], {}, true);
        }
        item.destroyRecord();
    },

    removeItemAnnotation(itemAnnotation) {
        const currentAnnotation = this.get('uiState.models.annotation');
        if (itemAnnotation.get('orderedAnnotations').includes(currentAnnotation)) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample', [], {}, true);
        }
        itemAnnotation.destroyRecord();
    },

    removeAnnotation(annotation) {
        const currentAnnotation = this.get('uiState.models.annotation');
        if (annotation === currentAnnotation) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample', [], {}, true);
        }
        annotation.destroyRecord();
    },

    selectAnnotation(annotation) {
        if (this.get('uiState.models.annotation') !== annotation) {
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample.annotation',
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
        routing.transitionTo('projects.project.spider.sample', [], {}, true);
    },

    addElementToAnnotation(annotation, element) {
        const selector = uniquePathSelectorFromElement(element);
        const acceptSelectors = annotation.get('acceptSelectors');
        const rejectSelectors = annotation.get('rejectSelectors');
        acceptSelectors.addObject(selector);
        rejectSelectors.removeObject(selector);
        annotation.set('acceptSelectors', acceptSelectors.slice());
        annotation.set('rejectSelectors', rejectSelectors.slice());
        annotation.save();
        this.selectAnnotationElement(annotation, element);
    },

    removeElementFromAnnotation(annotation, element) {
        const selector = uniquePathSelectorFromElement(element);
        const acceptSelectors = annotation.get('acceptSelectors');
        const rejectSelectors = annotation.get('rejectSelectors');
        acceptSelectors.removeObject(selector);
        rejectSelectors.addObject(selector);
        annotation.set('acceptSelectors', acceptSelectors.slice());
        annotation.set('rejectSelectors', rejectSelectors.slice());
        annotation.save();
        this.selectAnnotation(annotation);
    }
});
