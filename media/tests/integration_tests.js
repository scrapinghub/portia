module('integration tests', {
    setup: function() {
        Ember.run(function() {
            ASTool.reset();
            ASTool.deferReadiness();
        });
    },

    teardown: function() {},
});

test('navigate test', function() {
    Ember.run(ASTool, 'advanceReadiness');
    Ember.run(function() {
        wait().
        click('[name="editSpider_test"]').
        click('[name="editTemplate_http://observa.com.uy"]').
        click('[name~="8bc3a"]').
        then(function() {
            equal(1, 1);
        })
    });
});