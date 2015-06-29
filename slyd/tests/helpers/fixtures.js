import config from 'portia-web/config/environment';
import Ember from 'ember';

var origin = (config.SLYD_URL || window.location.protocol + '//' + window.location.host);

var fixtures = {};

function fixture(endpoint, response) {
    fixtures[endpoint] = response;
}

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
    "custom": {
        "branding": {
            "component": "scrapinghub-branding",
            "data": {
                "logo_url": "/static/scrapinghub-logo.png",
                "url": "http://33.33.33.51:8000"
            }
        }
    },
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

fixtures['POST /projects'] = function(data) {
    var pid = data.args[0];
    if(data.cmd === 'conflicts'){
        if(pid === 12){
            return {
                'fileWithConflicts.json': {}
            };
        }
        return {};
    }
    console.log('POST command without fixture', data);
};

Ember.$.ajax = function(args){
    var url = args.url.replace(/^https?:\/\/[^\/]+/, '');
    if(args.type === 'GET' && url in fixtures) {
        args.success(fixtures[url], 'sucess', {});
    } else if (args.type === 'POST' && ('POST ' + url) in fixtures) {
        args.success(fixtures['POST ' + url](JSON.parse(args.data)), 'sucess', {});
    } else {
        console.log('Undefined fixture', args);
        args.success({}, 'sucess', {});
    }
};
