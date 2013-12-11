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

function stubEndpoint(endpoint, response) {
    var url = ASTool.slydUrl + TEST_PROJECT_NAME + endpoint;
    ic.ajax.defineFixture(url, {
        response: response,
        jqXHR: {},
        textStatus: 'success'
    });
}

test('map attribute test', function() {
    stubEndpoint('/spec/spiders', spiderNamesJson);
    stubEndpoint('/spec/spiders/spider1', spider1Json); 
    stubEndpoint('/spec/items', itemsJson); 

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