module('integration tests', {
    setup: function() {
        Ember.run(function() {
            ASTool.reset();
            ASTool.deferReadiness();
        });
    },

    teardown: function() {
        ic.ajax.FIXTURES = {};
    },
});

var TEST_PROJECT_NAME = 'test';

function stubEndpoint(endpoint, response, method) {
    method = method || 'GET';
    var url = ASTool.slydUrl + TEST_PROJECT_NAME + endpoint;
    ic.ajax.defineFixture(url, method, {
        response: response,
        jqXHR: {},
        textStatus: 'success'
    });
}

function callCount(endpoint, method) {
    method = method || 'GET';
    var url = ASTool.slydUrl + TEST_PROJECT_NAME + endpoint;
    return ic.ajax.callCount(url, method);
}

test('add item & field test', function() {
    stubEndpoint('/spec/spiders', []);
    stubEndpoint('/spec/items', {}, 'POST'); 
    stubEndpoint('/spec/items', {});
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="gotoItems"]').
        click('[name*="addItem"]').
        click('[name*="addField"]').
        then(function() {
            equal(exists('[name*="fieldName"]'), true);
        }).
        click('[name*="back"]')
    });
});

test('add spider test', function() {
    ASTool.guid = function() {
        return 'test_guid'
    };
    stubEndpoint('/spec/spiders', []);
    stubEndpoint('/spec/spiders/test_', [], 'POST');
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="addSpider"]').
        then(function() {
            equal(exists('[name*="editSpider"]'), true);
            ASTool.guid = guid;
        })
    });
});

test('add starturl test', function() {
    stubEndpoint('/spec/spiders', spiderNamesJson);
    stubEndpoint('/spec/spiders/spider1', $.extend(true, {}, spider1Json));
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="editSpider"]').
        fillIn('[name*="startUrlTextField"]', 'http://newurl.com').
        click('[name*="addStartUrl"]').
        then(function() {
           equal(exists('[name*="fetchPage_http://newurl.com"]'), true);
        })
    });
});

test('map attribute test', function() {
    //FIXME: This test is flaky in firefox.
    stubEndpoint('/spec/spiders', spiderNamesJson);
    stubEndpoint('/spec/spiders/spider1', $.extend(true, {}, spider1Json)); 
    stubEndpoint('/spec/items', itemsJson);
    stubEndpoint('/spec/items', {}, 'POST');
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="editSpider"]').
        click('[name*="editTemplate_http://site1"]').
        click('[name*="editAnnotation"]').
        click('[name*="mapAttribute"]').
        click('[name*="chooseField"]').
        then(function() {
            equal(exists('[name*="unmapAttribute"]'), true);
        })
    });
});

test('delete annotation test', function() {
    //FIXME: This test is flaky in firefox.
    stubEndpoint('/spec/spiders', spiderNamesJson);
    stubEndpoint('/spec/spiders/spider1', $.extend(true, {}, spider1Json)); 
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="editSpider"]').
        click('[name*="editTemplate_http://site1"]').
        then(function() {
            equal(exists('[name*="editAnnotation"]'), true);
        }).
        click('[name*="deleteAnnotation"]').
        then(function() {
            equal(exists('[name*="editAnnotation"]'), false);
        })
    });
});

test('items saved automatically', function() {
    stubEndpoint('/spec/spiders', []);
    stubEndpoint('/spec/items', $.extend(true, {}, itemsJson));
    stubEndpoint('/spec/items', {}, 'POST');
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="gotoItems"]').
        click('[name*="back"]').
        then(function() {
            // Items should be saved when we leave the items screen.
            equal(callCount('/spec/items', 'POST'), 1);
        })
    });
});
