module('integration tests', {
    setup: function() {
        window.alert = null;
        Ember.run(function() {
            ASTool.reset();
            ASTool.deferReadiness();
        });
    },

    teardown: function() {
        ic.ajax.FIXTURES = {};
    },
});

function stubEndpoint(endpoint, response, method) {
    method = method || 'GET';
    var url = ASTool.SlydApi.getApiUrl() + endpoint;
    console.log(url);
    ic.ajax.defineFixture(url, method, {
        response: response,
        jqXHR: {},
        textStatus: 'success'
    });
}

function callCount(endpoint, method) {
    method = method || 'GET';
    var url = ASTool.SlydApi.getApiUrl() + endpoint;
    return ic.ajax.callCount(url, method);
}

test ('create project for site', function() {
    stubEndpoint('', []);
    stubEndpoint('', '', 'POST');
    stubEndpoint('/new_project/spec/items', {}, 'POST');
    stubEndpoint('/new_project/spec/extractors', {}, 'POST');
    stubEndpoint('/new_project/spec/spiders/scrapinghub.com', null, 'POST');
    stubEndpoint('/new_project/spec/spiders', []);
    stubEndpoint('/new_project/spec/items', itemsJson);
    stubEndpoint('/new_project/spec/spiders/scrapinghub.com', $.extend(true, {}, spider1Json));
    stubEndpoint('/new_project/bot/fetch', fetchedPageJson, 'POST');
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        fillIn('[name*="projectSite"]', 'scrapinghub.com').
        click('[name*="createProject"]').
        then(function() {
            equal(callCount('/new_project/spec/items', 'POST'), 1);
            equal(callCount('/new_project/spec/extractors', 'POST'), 1);
            equal(callCount('/new_project/spec/spiders/scrapinghub.com', 'POST'), 2);
            equal(callCount('/new_project/bot/fetch', 'POST'), 1);
            equal(exists('[name*="fetchPage_http://scrapinghub.com"]'), true);
        });
    });
});

test('delete project', function() {
    stubEndpoint('', ['project1']);
    stubEndpoint('', '', 'POST');
    window.confirm = function() { return true };
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        then(function() {
            equal(exists('[name*="openProject"]'), true);
        });
        click('[name*="deleteProject"]').
        then(function() {
            equal(callCount('', 'POST'), 1);
        }).
        then(function() {
            equal(exists('[name*="openProject"]'), false);
        });
    });
});

test('rename project', function() {
    // TODO: this test fails in Firefox. It seems that bluring
    // the input does not trigger the registered event. Investigate
    // more.
    stubEndpoint('', ['p1']);
    stubEndpoint('', '', 'POST');
    stubEndpoint('/p1/spec/spiders', []);
    stubEndpoint('/newname/spec/spiders', []);
    window.confirm = function() { return true };
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        click('[name*="openProject"]').
        click('[name*="rename"]').
        fillIn('[name*="inline_textfield"]', 'newname').
        blur('[name*="inline_textfield"]').
        then(function() {
            equal(exists('span.editable-name:contains("newname")'), true);
            equal(callCount('', 'POST'), 1);
        });
    });
});

test('add item & field test', function() {
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', spiderNamesJson);
    stubEndpoint('/p1/spec/spiders/spider1', $.extend(true, {}, spider1Json));
    stubEndpoint('/p1/spec/items', {}, 'POST'); 
    stubEndpoint('/p1/spec/extractors', {});
    stubEndpoint('/p1/spec/items', {});
    ASTool.shortGuid = function() { return 'guid' };
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        click('[name*="openProject"]').
        click('[name*="editSpider"]').
        click('[name*="editTemplate"]').
        click('[name*="editItems"]').
        click('[name*="addItem"]').
        click('[name*="addField"]').
        then(function() {
            equal(exists('span.editable-name:contains("Item guid")'), true);
            equal(exists('span.editable-name:contains("new field")'), true);
            ASTool.shortGuid = shortGuid;
        });
    });
});

test('add spider test', function() {
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', []);
    stubEndpoint('/p1/spec/items', {});
    stubEndpoint('/p1/spec/spiders/newurl.com', null, 'POST');
    stubEndpoint('/p1/spec/spiders/newurl.com', $.extend(true, {}, spider1Json));
    stubEndpoint('/p1/bot/fetch', fetchedPageJson, 'POST');
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        click('[name*="openProject"]').
        fillIn('[name*="spiderPageTextField"]', 'http://newurl.com').
        click('[name*="addSpider"]').
        then(function() {
            equal(exists('span.editable-name:contains("newurl.com")'), true);
            equal(callCount('/p1/bot/fetch', 'POST'), 1);
            equal(callCount('/p1/spec/spiders/newurl.com', 'POST'), 2);
        })
    });
});

test('add starturl test', function() {
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/extractors', {});
    stubEndpoint('/p1/spec/items', {});
    stubEndpoint('/p1/spec/spiders', spiderNamesJson);
    stubEndpoint('/p1/spec/spiders/spider1', $.extend(true, {}, spider1Json));
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        click('[name*="openProject"]').
        click('[name*="editSpider"]').
        fillIn('[name*="startUrlTextField"]', 'http://newurl.com').
        click('[name*="addStartUrl"]').
        then(function() {
           equal(exists('[name*="fetchPage_http://newurl.com"]'), true);
        })
    });
});

test('map attribute test', function() {
    var spider = $.extend(true, {}, spider1Json);
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', spiderNamesJson);
    stubEndpoint('/p1/spec/spiders/spider1', spider); 
    stubEndpoint('/p1/spec/spiders/spider1', null, 'POST');
    stubEndpoint('/p1/spec/items', itemsJson);
    stubEndpoint('/p1/spec/items', {}, 'POST');
    stubEndpoint('/p1/spec/extractors', {});
    stubEndpoint('/p1/spec/extractors', {}, 'POST');
    stubEndpoint('/p1/bot/fetch', fetchedPageJson, 'POST');
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        click('[name*="openProject"]').
        click('[name*="editSpider"]').
        // This should't be needed but fixes Firefox flakyness for this test.
        sleep().
        click('[name*="editTemplate_t1"]').
        then(function() {
            equal(hasAnnotation(spider.templates[0].annotated_body, 'content', 'description'), false);
        }).
        fillIn('[name*="fieldSelect"]', 'description').
        click('[name*="continueBrowsing"]').
        then(function() {
            equal(hasAnnotation(spider.templates[0].annotated_body, 'content', 'description'), true);
        })
    });
});

test('delete annotation test', function() {
    var spider = $.extend(true, {}, spider1Json);
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', spiderNamesJson);
    stubEndpoint('/p1/spec/spiders/spider1', spider);
    stubEndpoint('/p1/spec/spiders/spider1', null, 'POST');
    stubEndpoint('/p1/spec/items', itemsJson);
    stubEndpoint('/p1/spec/extractors', {});
    stubEndpoint('/p1/spec/extractors', {}, 'POST');
    stubEndpoint('/p1/bot/fetch', fetchedPageJson, 'POST');
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        click('[name*="openProject"]').
        click('[name*="editSpider"]').
        // This should't be needed but fixes Firefox flakyness for this test.
        sleep().
        click('[name*="editTemplate_t2"]').
        then(function() {
            equal(hasAnnotation(spider.templates[1].annotated_body, 'content', 'description'), true);
        }).
        click('[name*="deleteAnnotation"]').
        click('[name*="continueBrowsing"]').
        then(function() {
            equal(hasAnnotation(spider.templates[1].annotated_body, 'content', 'description'), false);
        })
    });
});

test('add exclude pattern', function() {
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/extractors', {});
    stubEndpoint('/p1/spec/items', {});
    stubEndpoint('/p1/spec/spiders', spiderNamesJson);
    stubEndpoint('/p1/spec/spiders/spider1', $.extend(true, {}, spider1Json));
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        click('[name*="openProject"]').
        click('[name*="editSpider"]').
        fillIn('[name*="followSelect"]', 'patterns').
        fillIn('[name*="excludePatternTextField"]', 'my_test_pattern').
        click('[name*="addExcludePattern"]').
        then(function() {
           equal(exists('[name*="my_test_pattern"]'), true);
        })
    });
});

test('ignore subregion & delete ignore', function() {
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', spiderNamesJson);
    stubEndpoint('/p1/spec/spiders/spider1', $.extend(true, {}, spider1Json));
    stubEndpoint('/p1/spec/extractors', {});
    stubEndpoint('/p1/spec/items', {});
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        click('[name*="openProject"]').
        click('[name*="editSpider"]').
        // This should't be needed but fixes Firefox flakyness for this test.
        sleep().
        click('[name*="editTemplate_t1"]').
        click('[name*="editAnnotation"]').
        click('[name*="addIgnore"]')
        iframeClick('#xxx').
        then(function() {
            equal(exists(':contains("Ignore elements beneath")'), true);
        }).
        click('[name*="deleteIgnore"]').
        then(function() {
            equal(exists(':contains("Ignore elements beneath")'), false);
        })
    });
});
