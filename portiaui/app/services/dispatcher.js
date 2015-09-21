import Ember from 'ember';
import Sample from '../models/sample';
import {getAttributeList} from '../components/inspector-panel';
import {uniquePathSelectorFromElement} from '../utils/selectors';


export function computedCanAddStartUrl(spiderPropertyName) {
    return Ember.computed('browser.url', `${spiderPropertyName}.startUrls.[]`, function() {
        const url = this.get('browser.url');
        return url && !this.get(`${spiderPropertyName}.startUrls`).includes(url);
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

    addStartUrl(spider) {
        const url = this.get('browser.url');
        spider.get('startUrls').pushObject(url);
        spider.save();
    },

    addSample(spider) {
        const url = this.get('browser.url');
        if (!url) {
            return;
        }

        const store = this.get('store');
        const name = Sample.normalizeTitle(this.get('browser.document').title);
        const sample = store.createRecord('sample', {
            name: name,
            url: url,
            spider: spider
        });
        sample.save().then(() => {
            let schema = store.createRecord('schema', {
                name: name,
                project: spider.get('project')
            });
            schema.save().then(() => {
                store.createRecord('item', {
                    sample: sample,
                    schema: schema
                });
            });

            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample',
                [spider.get('id'), sample.get('id')], {}, true);
       });
    },

    addItem() {
        const store = this.get('store');
        const sample = this.get('uiState.models.sample');
        const schema = store.createRecord('schema', {
            name: sample.get('name'),
            project: sample.get('spider.project')
        });
        schema.save().then(() => {
            store.createRecord('item', {
                sample: sample,
                schema: schema
            });
        });
    },

    addAnnotation(element) {
        const store = this.get('store');
        const item = this.get('uiState.models.sample.items.firstObject');
        const annotation = store.createRecord('annotation', {
            name: `annotation${item.get('annotations.length') + 1}`,
            parent: item,
            type: 'text',
            selector: uniquePathSelectorFromElement(element)
        });
        const attributes = getAttributeList(element);
        if (attributes.length === 1 && attributes[0].attribute) {
            annotation.attribute = attributes[0].attribute;
        }
        if (element.tagName.toLowerCase() === 'img') {
            annotation.type = 'image';
        }
        annotation.save().then(() => {
            this.set('uiState.viewPort.selectedElement', element);
            const routing = this.get('routing');
            routing.transitionTo('projects.project.spider.sample.annotation',
                [annotation.get('id')], {}, true);
        });
    },

    removeStartUrl(url, spider) {
        spider.get('startUrls').removeObject(url);
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
    }
});
