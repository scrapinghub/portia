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
    var url = SLYD_URL + endpoint;
    ic.ajax.defineFixture(url, method, {
        response: response,
        jqXHR: {},
        textStatus: 'success'
    });
}

function callCount(endpoint, method) {
    method = method || 'GET';
    var url = SLYD_URL + endpoint;
    return ic.ajax.callCount(url, method);
}

test('create project', function() {
    stubEndpoint('', []);
    stubEndpoint('', '', 'POST');
    stubEndpoint('/new_project_1/spec/spiders', []);
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="createProject"]').
        then(function() {
            equal(callCount('', 'POST'), 1);
        });
    });
});

test('delete project', function() {
    stubEndpoint('', ['p1']);
    stubEndpoint('', '', 'POST');
    stubEndpoint('/new_project_1/spec/spiders', []);
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
    stubEndpoint('', ['p1']);
    stubEndpoint('', '', 'POST');
    stubEndpoint('/p1/spec/spiders', []);
    window.confirm = function() { return true };
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('div').
        click('[name*="openProject"]').
        click('[name*="rename"]').
        fillIn('[name*="inline_textfield"]', 'newname').
        focus('h3').
        then(function() {
            equal(exists('[name*="newname"]'), true);
            equal(callCount('', 'POST'), 1);
        });
    });
});

test('add item & field test', function() {
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', []);
    stubEndpoint('/p1/spec/spiders', []);
    stubEndpoint('/p1/spec/items', {}, 'POST'); 
    stubEndpoint('/p1/spec/items', {});
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="openProject"]').
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
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', []);
    stubEndpoint('/p1/spec/spiders/test_', null, 'POST');
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="openProject"]').
        click('[name*="addSpider"]').
        then(function() {
            equal(exists('[name*="editSpider"]'), true);
            ASTool.guid = guid;
        })
    });
});

test('add starturl test', function() {
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', spiderNamesJson);
    stubEndpoint('/p1/spec/spiders/spider1', $.extend(true, {}, spider1Json));
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
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
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', spiderNamesJson);
    stubEndpoint('/p1/spec/spiders/spider1', $.extend(true, {}, spider1Json)); 
    stubEndpoint('/p1/spec/items', itemsJson);
    stubEndpoint('/p1/spec/items', {}, 'POST');
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="openProject"]').
        click('[name*="editSpider"]').
        // This should't be needed fixes Firefox flakyness for this test.
        sleep().
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
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', spiderNamesJson);
    stubEndpoint('/p1/spec/spiders/spider1', $.extend(true, {}, spider1Json)); 
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="openProject"]').
        click('[name*="editSpider"]').
        // This should't be needed fixes Firefox flakyness for this test.
        sleep().
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
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', []);
    stubEndpoint('/p1/spec/items', $.extend(true, {}, itemsJson));
    stubEndpoint('/p1/spec/items', {}, 'POST');
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="openProject"]').
        click('[name*="gotoItems"]').
        click('[name*="back"]').
        then(function() {
            // Items should be saved when we leave the items screen.
            equal(callCount('/p1/spec/items', 'POST'), 1);
        })
    });
});

test('add exclude pattern', function() {
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', spiderNamesJson);
    stubEndpoint('/p1/spec/spiders/spider1', $.extend(true, {}, spider1Json)); 
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="openProject"]').
        click('[name*="editSpider"]').
        fillIn('[name*="excludePatternTextField"]', 'test_pattern').
        click('[name*="addExcludePattern"]').
        then(function() {
           equal(exists('[name*="editExcludePattern_test_pattern"]'), true);
        })
    });
});

test('ignore subregion & delete ignore', function() {
    stubEndpoint('', ['p1']);
    stubEndpoint('/p1/spec/spiders', spiderNamesJson);
    stubEndpoint('/p1/spec/spiders/spider1', $.extend(true, {}, spider1Json)); 
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name*="openProject"]').
        click('[name*="editSpider"]').
        // This should't be needed fixes Firefox flakyness for this test.
        sleep().
        click('[name*="editTemplate_http://site1"]').
        click('[name*="editAnnotation"]').
        click('[name*="addIgnore"]').
        iframeClick('#xxx').
        then(function() {
            equal(exists('[name*="ignore_"]'), true);
        }).
        click('[name*="deleteIgnore"]').
        then(function() {
            equal(exists('[name*="ignore_"]'), false);
        })
    });
});
