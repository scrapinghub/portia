import config from 'portia-web/config/environment';
import Ember from 'ember';

var fixtures = {};

fixtures['/server_capabilities'] = {
    "capabilities": {
        "create_projects": false,
        "delete_projects": false,
        "deploy_projects": false,
        "plugins": [
            {
                "component": "portiaWeb.annotations-plugin",
                "options": {
                    "fillColor": "rgba(88,150,220,0.4)",
                    "name": "annotations-plugin",
                    "strokeColor": "rgba(88,150,220,0.4)",
                    "textColor": "white"
                }
            }
        ],
        "rename_projects": false,
        "rename_spiders": true,
        "rename_templates": true,
        "version_control": true
    },
    "custom": {},
    "username": "tester"
};

fixtures['/projects'] = [{id: 11, name: 'Test Project 1'}, {id:12, name: 'Test Project 2'}];

fixtures['/projects/11/spec/spiders'] = ['spider1', 'spider2'];
fixtures['/projects/12/spec/spiders'] = ['spider3'];
fixtures['/projects/11/spec/spiders/spider1'] = {
    "exclude_patterns": [],
    "follow_patterns": [],
    "id": "2622-4f82-abd5",
    "init_requests": [],
    "links_to_follow": "patterns",
    "respect_nofollow": true,
    "start_urls": [
        "http://portiatest.com"
    ],
    "template_names": [
        "Template1"
    ],
    "templates": []
};

fixtures['/projects/11/spec/items'] = {
    "default": {
        "fields": {
            "required": {
                "required": true,
                "type": "text",
                "vary": false
            },
            "optional": {
                "required": false,
                "type": "text",
                "vary": false
            },
            "image": {
                "required": false,
                "type": "image",
                "vary": false
            },
            "text": {
                "required": false,
                "type": "text",
                "vary": false
            },
            "price": {
                "required": true,
                "type": "price",
                "vary": false
            },
            "safe_html": {
                "required": true,
                "type": "safe html",
                "vary": false
            }
        }
    }
};

fixtures['POST /projects'] = function(data) {
    var pid = data.args[0];
    if(data.cmd === 'conflicts'){
        return {};
    } else if(data.cmd === 'edit') {
        return {};
    } else if(data.cmd === 'changes') {
        return [];
    }
    console.log('POST command without fixture', JSON.stringify(data));
};

fixtures['POST /projects/11/spec/spiders/spider1'] = Ember.$.noop;

export var lastRequest = {
    method: null,
    url: null,
    data: null
};

Ember.$.ajax = function(args){
    var url = args.url.replace(/^https?:\/\/[^\/]+/, '');
    var data = args.data && JSON.parse(args.data);
    lastRequest.method = args.type;
    lastRequest.url = url;
    lastRequest.data = data;
    if(args.type === 'GET' && url in fixtures) {
        args.success(fixtures[url], 'sucess', {});
    } else if (args.type === 'POST' && ('POST ' + url) in fixtures) {
        args.success(fixtures['POST ' + url](data), 'sucess', {});
    } else {
        console.log('Undefined fixture: ' + args.type + ' ' + url + (data ? ' ' + JSON.stringify(data) : ''));
        args.success({}, 'sucess', {});
    }
};
