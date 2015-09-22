import Ember from 'ember';
import ActiveChildrenMixin from '../mixins/active-children';
import InstanceCachedObjectProxy from '../utils/instance-cached-object-proxy';
import ToolPanel from './tool-panel';
import {computedIsCurrentModelById} from '../services/ui-state';


const SampleItem = InstanceCachedObjectProxy.extend({
    uiState: Ember.inject.service(),

    itemComponentName: 'project-structure-sample-item',

    active: Ember.computed.readOnly('isCurrentSample'),
    isCurrentSample: computedIsCurrentModelById('sample'),
    key: Ember.computed('id', 'spider.id', function() {
        const id = this.get('id');
        const spiderId = this.get('spider.id');
        return `spider:${spiderId}:sample:${id}`;
    })
});

const SampleList = Ember.Object.extend(ActiveChildrenMixin, {
    itemComponentName: 'project-structure-sample-root-item',

    children: Ember.computed.map('spider.samples', function(sample) {
        return SampleItem.create({
            content: sample,
            container: this.get('container')
        });
    }),
    key: Ember.computed('spider.id', function() {
        const spiderId = this.get('spider.id');
        return `spider:${spiderId}:samples`;
    })
});

const SpiderItem = InstanceCachedObjectProxy.extend(ActiveChildrenMixin, {
    uiState: Ember.inject.service(),

    itemComponentName: 'project-structure-spider-item',
    sampleList: null,

    active: Ember.computed.readOnly('isCurrentSpider'),
    children: Ember.computed('startUrls.[]', function() {
        const id = this.get('id');
        const urls = this.get('startUrls');
        var urlsItem = {
            itemComponentName: 'project-structure-url-root-item',
            key: `spider:${id}:urls`,
            spider: this
        };
        if (urls && urls.length) {
            urlsItem.children = urls.map(url => ({
                itemComponentName: 'project-structure-url-item',
                key: `spider:${id}:url:${url}`,
                name: url,
                spider: this
            }));
        }
        return [urlsItem, this.sampleList];
    }),
    collapsed: Ember.computed('isCurrentSpider', 'created', function() {
        return !this.get('isCurrentSpider') && !this.get('created');
    }),
    doNotRenderCollapsedChildren: Ember.computed.not('isCurrentSpider'),
    isCurrentSpider: computedIsCurrentModelById('spider'),
    key: Ember.computed('id', function() {
        const id = this.get('id');
        return `spider:${id}`;
    }),

    init() {
        this._super();
        this.sampleList = SampleList.create({
            spider: this,
            container: this.get('container')
        });
    }
});

const SpiderList = Ember.Object.extend(ActiveChildrenMixin, {
    itemComponentName: 'project-structure-spider-root-item',
    key: 'spiders',

    children: Ember.computed.map('project.spiders', function(spider) {
        return SpiderItem.create({
            content: spider,
            container: this.get('container')
        });
    }),
    project: Ember.computed.readOnly('toolPanel.project')
});

const SchemaItem = InstanceCachedObjectProxy.extend({
    uiState: Ember.inject.service(),

    itemComponentName: 'project-structure-schema-item',

    active: Ember.computed.readOnly('isCurrentSchema'),
    isCurrentSchema: computedIsCurrentModelById('schema'),
    key: Ember.computed('id', function() {
        const id = this.get('id');
        return `schema:${id}`;
    })
});

const SchemaList = Ember.Object.extend(ActiveChildrenMixin, {
    itemComponentName: 'project-structure-schema-root-item',
    key: 'schemas',

    children: Ember.computed.map('project.schemas', function(schema) {
        return SchemaItem.create({
            content: schema,
            container: this.get('container')
        });
    }),
    project: Ember.computed.readOnly('toolPanel.project')
});

export default ToolPanel.extend({
    schemaList: null,
    tabComponentName: 'project-structure-tab',
    toolId: 'project-structure',

    projectTree: null,

    init() {
        this._super();
        const container = this.get('container');
        this.set('projectTree', [
            SpiderList.create({
                toolPanel: this,
                container: container
            }),
/*
            SchemaList.create({
              toolPanel: this,
                container: container
            })
*/
        ]);
        this.get('project.schemas');
    }
});
