document.write('<div id="ember-testing-container"><div id="ember-testing"></div></div>');

ASTool.rootElement = '#ember-testing';
ASTool.setupForTesting();
ASTool.injectTestHelpers();

function exists(selector) {
    return !!find(selector).length;
}
