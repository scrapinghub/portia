import Ember from 'ember';
import ToolPanel from './tool-panel';

var SpiderItem = Ember.ObjectProxy.extend({
    _routing: Ember.inject.service('-routing'),
    component: 'project-structure-spider-item',
    collapsed: Ember.computed('id', 'project.id', '_routing.currentState', function() {
        return !this.get('_routing').isActiveForRoute(
            [this.get('project.id'), this.get('id')],
            {},
            'projects.project.spider',
            this.get('_routing.currentState'),
            false);
    }),
    key: Ember.computed('id', function() {
        return 'spider:' + this.get('id');
    }),
    children: Ember.computed('start_urls', 'samples', function() {
        var urlsItem = {
            //component: 'project-structure-url-root-item',
            name: 'Start URLs',
            key: 'spider:' + this.get('id') + ':urls'
        };
        var urls = this.get('start_urls');
        if (urls && urls.length) {
            urlsItem.children = urls.map(url => ({
                //component: 'project-structure-url-item',
                name: url,
                key: 'spider:' + this.get('id') + ':url:' + url
            }));
        }
        return [urlsItem, SampleList.create({
            spider: this.get('content')
        })];
    })
});

var SampleItem = Ember.ObjectProxy.extend({
    component: 'project-structure-sample-item',
    key: Ember.computed('id', 'spider.id', function() {
        return 'spider:' + this.get('spider.id') + ':sample:' + this.get('id');
    })
});

var SampleList = Ember.Object.extend({
    //component: 'project-structure-sample-root-item',
    name: 'Samples',
    key: Ember.computed('spider.id', function() {
        return 'spider:' + this.get('id') + ':samples';
    }),
    children: Ember.computed.map('spider.samples', sample => SampleItem.create({
        content: sample
    }))
});

var SchemaItem = Ember.ObjectProxy.extend({
    component: 'project-structure-schema-item',
    key: Ember.computed('id', function() {
        return 'schema:' + this.get('id');
    })
});

var SchemaList = Ember.Object.extend({
    //component: 'project-structure-schema-root-item',
    name: 'Schemas',
    key: 'schemas',
    children: Ember.computed.map('project.schemas', schema => SchemaItem.create({
        content: schema
    }))
});

export default ToolPanel.extend({
    title: Ember.computed.readOnly('project.name'),
    toolId: 'project-structure',
    projectTree: Ember.computed('project', 'project.spiders', function() {
        var items = this.get('project.spiders').map(spider => SpiderItem.create({
            content: spider,
            container: this.get('container')
        }));
        items.push(SchemaList.create({
            project: this.get('project')
        }));
        return items;
    })
});
