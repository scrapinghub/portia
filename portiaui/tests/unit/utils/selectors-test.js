import Ember from 'ember';
import SelectorMatcher from '../../../services/selector-matcher';
import {
    findContainer,
    findRepeatedContainers,
    BaseSelectorGenerator,
    ContainerSelectorGenerator,
    AnnotationSelectorGenerator
} from '../../../utils/selectors';
import { module, test, skip } from 'qunit';

module('Unit | Utility | selectors');

class MockBrowser {
    constructor(documentRoot) {
        this.$document = Ember.$(documentRoot);
    }
}

test('BaseSelectorGenerator computes paths for all elements', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1"><li id="li1"></li><li id="li2"></li><li id="li3"></li></ul></div></main>');
    const selector = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#div2, #li1, #li2, #li3').toArray()
    });
    const idPaths = selector.get('paths').map(
        path => path.map(
            element => element.id));
    assert.deepEqual(idPaths, [
        ['main', 'div1', 'div2'],
        ['main', 'div1', 'ul1', 'li1'],
        ['main', 'div1', 'ul1', 'li2'],
        ['main', 'div1', 'ul1', 'li3']
    ]);
});

test('BaseSelectorGenerator groups paths for all elements', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1"><li id="li1"></li><li id="li2"></li><li id="li3"></li></ul></div></main>');
    const selector = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#div2, #li1, #li2, #li3').toArray()
    });
    const groupedIdPaths = selector.get('groupedPaths').map(
        group => group.map(
            path => path.map(
                element => element.id)));
    assert.deepEqual(groupedIdPaths, [
        [
            ['main', 'div1', 'div2']
        ],
        [
            ['main', 'div1', 'ul1', 'li1'],
            ['main', 'div1', 'ul1', 'li2'],
            ['main', 'div1', 'ul1', 'li3']
        ]
    ]);
});

test('BaseSelectorGenerator generates selectors for groups of elements', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1"><li id="li1"></li><li id="li2"></li><li id="li3"></li></ul></div></main>');
    const selector = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#div2, #li1, #li2, #li3').toArray()
    });
    assert.deepEqual(selector.get('selectors'), [
        ['#div2'],
        ['li']
    ]);
    assert.equal(selector.get('selector'), '#div2, li');
});

test('BaseSelectorGenerator nesting generates correct selectors', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1"><li id="li1"></li><li id="li2"></li><li id="li3"></li></ul></div></main>');
    const selectorParent = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#div1, #li1, #li2, #li3').toArray()
    });
    const selector = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        parent: selectorParent,
        elements: $elements.find('#div2, #li1').toArray()
    });
    assert.deepEqual(selector.get('selectors'), [
        ['#div1 > div'],
        ['li']
    ]);
    assert.equal(selector.get('selector'), '#div1 > div, li');
});

test('ContainerSelectorGenerator propagates groups to child selectors', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1">' +
        '<li id="li1"><span id="span1-1"></span><span id="span1-2"></span><span id="span1-3"></span></li>' +
        '<li id="li2"><span id="span2-1"></span><span id="span2-2"></span><span id="span2-3"></span></li>' +
        '<li id="li3"><span id="span3-1"></span><span id="span3-2"></span><span id="span3-3"></span></li>' +
        '</ul></div></main>');
    const selectorParent = ContainerSelectorGenerator.create({});
    const selector1 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#span1-1').toArray()
    });
    const selector2 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#span1-2, #span2-2, #span3-2').toArray()
    });
    const selector3 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#span1-3').toArray()
    });
    selectorParent.addChildren([selector1, selector2, selector3]);
    assert.equal(selector1.get('selector'), 'li > span:nth-child(1)');
    assert.equal(selector2.get('selector'), 'li > span:nth-child(2)');
    assert.equal(selector3.get('selector'), 'li > span:nth-child(3)');
});

test('ContainerSelectorGenerator propagates groups to disjoint child selectors', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1">' +
        '<li id="li1"><span id="span1-1"></span><span id="span1-2"></span><span id="span1-3"></span></li>' +
        '<li id="li2"><span id="span2-1"></span><span id="span2-2"></span><span id="span2-3"></span></li>' +
        '<li id="li3"><span id="span3-1"></span><span id="span3-2"></span><span id="span3-3"></span></li>' +
        '</ul></div></main>');
    const selectorParent = ContainerSelectorGenerator.create({});
    const selector1 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#span1-1').toArray()
    });
    const selector2 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#span1-2, #span2-2, #span3-2').toArray()
    });
    const selector3 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#span2-3').toArray()
    });
    selectorParent.addChildren([selector1, selector2, selector3]);
    assert.equal(selector1.get('selector'), 'li > span:nth-child(1)');
    assert.equal(selector2.get('selector'), 'li > span:nth-child(2)');
    assert.equal(selector3.get('selector'), 'li > span:nth-child(3)');
});

skip('ContainerSelectorGenerator propagates groups to child selectors with additional trees', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1">' +
        '<li id="li1"><span id="span1-1"></span><span id="span1-2"></span><span id="span1-3"></span></li>' +
        '<li id="li2"><span id="span2-1"></span><span id="span2-2"></span><span id="span2-3"></span></li>' +
        '<li id="li3"><span id="span3-1"></span><span id="span3-2"></span><span id="span3-3"></span></li>' +
        '</ul></div></main>');
    const selectorParent = ContainerSelectorGenerator.create({});
    const selector1 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#div2, #span1-1').toArray()
    });
    const selector2 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#span1-2, #span2-2, #span3-2').toArray()
    });
    const selector3 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#span2-3').toArray()
    });
    selectorParent.addChildren([selector1, selector2, selector3]);
    assert.equal(selector1.get('selector'), '#div2, li > span:nth-child(1)');
    assert.equal(selector2.get('selector'), 'li > span:nth-child(2)');
    assert.equal(selector3.get('selector'), 'li > span:nth-child(3)');
});

test('ContainerSelectorGenerator propagates changes in a child selector to other children', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1">' +
        '<li id="li1"><span id="span1-1"></span><span id="span1-2"></span><span id="span1-3"></span></li>' +
        '<li id="li2"><span id="span2-1"></span><span id="span2-2"></span><span id="span2-3"></span></li>' +
        '<li id="li3"><span id="span3-1"></span><span id="span3-2"></span><span id="span3-3"></span></li>' +
        '</ul></div></main>');
    const selectorParent = ContainerSelectorGenerator.create({});
    const selector1 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#span1-1').toArray()
    });
    const selector2 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#span1-2, #span2-2').toArray()
    });
    const selector3 = BaseSelectorGenerator.create({
        annotation: Ember.Object.create({selectionMode: 'auto'}),
        elements: $elements.find('#span2-3').toArray()
    });
    selectorParent.addChildren([selector1, selector2, selector3]);
    assert.equal(selector1.get('selector'), 'li:nth-child(-n+2) > span:nth-child(1)');
    assert.equal(selector2.get('selector'), 'li:nth-child(-n+2) > span:nth-child(2)');
    assert.equal(selector3.get('selector'), 'li:nth-child(-n+2) > span:nth-child(3)');

    selector2.set('elements', $elements.find('#span1-2, #span2-2, #span3-2').toArray());
    assert.equal(selector1.get('selector'), 'li > span:nth-child(1)');
    assert.equal(selector2.get('selector'), 'li > span:nth-child(2)');
    assert.equal(selector3.get('selector'), 'li > span:nth-child(3)');
});

test('AnnotationSelectorGenerator generates selectors for groups of elements', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1"><li id="li1"></li><li id="li2"></li><li id="li3"></li></ul></div></main>');
    const selectorMatcher = SelectorMatcher.create({
        browser: new MockBrowser($elements)
    });
    const selector = AnnotationSelectorGenerator.create({
        selectorMatcher,
        annotation: Ember.Object.create({
            selectionMode: 'auto',
            acceptSelectors: ["#div2", "#li1", "#li2", "#li3"],
            rejectSelectors: []
        })
    });
    assert.equal(selector.get('generalizedSelector'), '#div2, #ul1 > li');
    assert.deepEqual(selector.get('selectors'), [
        ['#div2'],
        ['li']
    ]);
    assert.equal(selector.get('selector'), '#div2, li');
});

test('AnnotationSelectorGenerator generates generalized selectors', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1"><li id="li1"></li><li id="li2"></li><li id="li3"></li></ul></div></main>');
    const selectorMatcher = SelectorMatcher.create({
        browser: new MockBrowser($elements)
    });
    const selector2 = AnnotationSelectorGenerator.create({
        selectorMatcher,
        annotation: Ember.Object.create({
            selectionMode: 'auto',
            acceptSelectors: ["#div2", "#li1", "#li2"],
            rejectSelectors: []
        })
    });
    assert.equal(selector2.get('generalizedSelector'), '#div2, #ul1 > li');
    assert.equal(selector2.get('selector'), '#div2, li');
});

test('AnnotationSelectorGenerator generates repeated selectors for repeated field', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1"><li id="li1"></li><li id="li2"></li><li id="li3"></li></ul></div></main>');
    const selectorMatcher = SelectorMatcher.create({
        browser: new MockBrowser($elements)
    });
    const selectorParent = ContainerSelectorGenerator.create({});
    const repeatedSelector = AnnotationSelectorGenerator.create({
        selectorMatcher,
        annotation: Ember.Object.create({
            selectionMode: 'auto',
            acceptSelectors: ["#li1", "#li2"],
            rejectSelectors: []
        })
    });
    const standardSelector = AnnotationSelectorGenerator.create({
        selectorMatcher,
        annotation: Ember.Object.create({
            selectionMode: 'auto',
            acceptSelectors: ["#div2"],
            rejectSelectors: []
        })
    });
    selectorParent.addChildren([standardSelector, repeatedSelector]);
    assert.equal(repeatedSelector.get('generalizedSelector'), '#ul1 > li');
    assert.equal(repeatedSelector.get('repeatedAnnotation'), true);
    assert.equal(repeatedSelector.get('selector'), '#div1 > ul > li');
    assert.equal(standardSelector.get('generalizedSelector'), '#div2');
    assert.equal(standardSelector.get('repeatedAnnotation'), false);
    assert.equal(standardSelector.get('selector'), '#div1 > div');
    assert.equal(selectorParent.get('containerSelector'), '#div1');
    assert.equal(selectorParent.get('selector'), '#div1');
});


test('AnnotationSelectorGenerator supports rejecting selectors', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1"><li id="li1"></li><li id="li2"></li><li id="li3"></li></ul></div></main>');
    const selectorMatcher = SelectorMatcher.create({
        browser: new MockBrowser($elements)
    });
    const selector = AnnotationSelectorGenerator.create({
        selectorMatcher,
        annotation: Ember.Object.create({
            selectionMode: 'auto',
            acceptSelectors: ["#div2", "#li1", "#li2"],
            rejectSelectors: ["#li3"]
        })
    });
    assert.equal(selector.get('generalizedSelector'), '#div2, li:nth-child(-n+2)');
    assert.equal(selector.get('selector'), '#div2, li:nth-child(-n+2)');
});

test('AnnotationSelectorGenerator changes get propagated to siblings', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1">' +
        '<li id="li1"><span id="span1-1"></span><span id="span1-2"></span><span id="span1-3"></span></li>' +
        '<li id="li2"><span id="span2-1"></span><span id="span2-2"></span><span id="span2-3"></span></li>' +
        '<li id="li3"><span id="span3-1"></span><span id="span3-2"></span><span id="span3-3"></span></li>' +
        '</ul></div></main>');
    const selectorMatcher = SelectorMatcher.create({
        browser: new MockBrowser($elements)
    });
    const selectorParent = ContainerSelectorGenerator.create({});
    const selector1 = AnnotationSelectorGenerator.create({
        selectorMatcher,
        annotation: Ember.Object.create({
            id: 1,
            selectionMode: 'auto',
            acceptSelectors: ['#span1-1'],
            rejectSelectors: []
        })
    });
    const selector2 = AnnotationSelectorGenerator.create({
        selectorMatcher,
        annotation: Ember.Object.create({
            id: 2,
            selectionMode: 'auto',
            acceptSelectors: ['#span1-2'],
            rejectSelectors: []
        })
    });
    const selector3 = AnnotationSelectorGenerator.create({
        selectorMatcher,
        annotation: Ember.Object.create({
            id: 3,
            selectionMode: 'auto',
            acceptSelectors: ['#span2-3'],
            rejectSelectors: []
        })
    });
    selectorParent.addChildren([selector1, selector2, selector3]);
    assert.equal(selector1.get('selector'), '#ul1 > li:nth-child(1) > span:nth-child(1)');
    assert.equal(selector2.get('selector'), '#ul1 > li:nth-child(1) > span:nth-child(2)');
    assert.equal(selector3.get('selector'), '#ul1 > li:nth-child(2) > span:nth-child(3)');

    selector2.get('annotation.acceptSelectors').pushObject('#span2-2');
    assert.equal(selector1.get('selector'), 'li > span:nth-child(1)');
    assert.equal(selector2.get('selector'), 'li > span:nth-child(2)');
    assert.equal(selector3.get('selector'), 'li > span:nth-child(3)');

    selector2.get('annotation.rejectSelectors').pushObject('#span3-2');
    assert.equal(selector1.get('selector'), 'li:nth-child(-n+2) > span:nth-child(1)');
    assert.equal(selector2.get('selector'), 'li:nth-child(-n+2) > span:nth-child(2)');
    assert.equal(selector3.get('selector'), 'li:nth-child(-n+2) > span:nth-child(3)');
});

test('Nested AnnotationSelectorGenerator supports rejecting elements', function(assert) {
    const $elements = Ember.$('<main id="main"><div id="div1"><div id="div2"></div><ul id="ul1">' +
        '<li id="li1"><span id="span1-1"></span><span id="span1-2"></span><span id="span1-3"></span></li>' +
        '<li id="li2"><span id="span2-1"></span><span id="span2-2"></span><span id="span2-3"></span></li>' +
        '<li id="li3"><span id="span3-1"></span><span id="span3-2"></span><span id="span3-3"></span></li>' +
        '</ul></div></main>');
    const selectorMatcher = SelectorMatcher.create({
        browser: new MockBrowser($elements)
    });
    const selectorParent = ContainerSelectorGenerator.create({});
    const selector1 = AnnotationSelectorGenerator.create({
        selectorMatcher,
        annotation: Ember.Object.create({
            id: 1,
            selectionMode: 'auto',
            acceptSelectors: ['#span1-1'],
            rejectSelectors: []
        })
    });
    const selector2 = AnnotationSelectorGenerator.create({
        selectorMatcher,
        annotation: Ember.Object.create({
            id: 2,
            selectionMode: 'auto',
            acceptSelectors: ['#span1-2', '#span2-2', '#span3-2'],
            rejectSelectors: []
        })
    });
    const selector3 = AnnotationSelectorGenerator.create({
        selectorMatcher,
        annotation: Ember.Object.create({
            id: 3,
            selectionMode: 'auto',
            acceptSelectors: ['#span2-3'],
            rejectSelectors: []
        })
    });
    selectorParent.addChildren([selector1, selector2, selector3]);
    assert.equal(selector1.get('selector'), 'li > span:nth-child(1)');
    assert.equal(selector2.get('selector'), 'li > span:nth-child(2)');
    assert.equal(selector3.get('selector'), 'li > span:nth-child(3)');

    selector3.get('annotation.rejectSelectors').pushObject('#span1-3');
    assert.equal(selector1.get('selector'), 'li > span:nth-child(1)');
    assert.equal(selector2.get('selector'), 'li > span:nth-child(2)');
    assert.equal(selector3.get('selector'), 'li:nth-child(n+2) > span:nth-child(3)');
});

var commonFields = 'image title address area description price'.split(' ');
var getElements = function(testCase, fields) {
    let selectors = {
        image: `${testCase} .image > img`,
        title: `${testCase} .title > h3`,
        address: `${testCase} .address`,
        area: `${testCase} .address > span:nth-child(2)`,
        description: `${testCase} .description > p`,
        price: `${testCase} .description > span`,
        view: `${testCase} .views > span:nth-child(2)`,
        info: `${testCase} .info > span:nth-child(2)`
    };

    let structure = [];
    for (let field of fields) {
        structure.push(Array.from(doc.querySelectorAll(selectors[field])));
    }
    return structure;
};

var runTest = function(assert, type, fields, expected) {
    let elements = getElements(type, fields),
        container = findContainer(elements),
        [repeatedContainers, siblings] = findRepeatedContainers(elements, container);
    let containerId = '0';
    if (container) {
        containerId = container.getAttribute('data-tagid');
    }
    let repeatedContainerIds = repeatedContainers.map(
        element => element.getAttribute('data-tagid'));
    assert.deepEqual([containerId, repeatedContainerIds, siblings], expected);
};

test('regular', function(assert) {
    runTest(assert, '#regular-structure', commonFields, [
        '5',
        [
            '6',
            '17',
            '28',
            '39',
            '50',
            '61',
            '72',
            '83',
            '94'
        ],
        0
    ]);
});

test('regular-with-unneeded-rows', function(assert) {
    runTest(assert, '#regular-with-unneeded-rows', commonFields, [
        '107',
        [
            '108',
            '121',
            '134',
            '147',
            '160',
            '173',
            '186',
            '199',
            '212'
        ],
        0
    ]);
});

test('nested-rows-and-columns', function(assert) {
    runTest(assert, '#nested-rows-and-columns', commonFields, [
        '225',
        [
            '227',
            '238',
            '249',
            '261',
            '272',
            '283',
            '295',
            '306',
            '317'
        ],
        0
    ]);
});

test('items-with-some-fields-missing', function(assert) {
    runTest(assert, '#items-with-some-fields-missing', commonFields, [
        '330',
        [
            '331',
            '339',
            '350',
            '361',
            '372',
            '383',
            '391',
            '402',
            '410'
        ],
        0
    ]);
});

test('items-with-siblings', function(assert) {
    let fields = commonFields.slice(0, commonFields.length);
    fields.push('view');
    runTest(assert, '#items-spread-across-siblings', fields, [
        '423',
        [
            '424',
            '438',
            '452',
            '466',
            '480',
            '494',
            '508',
            '522',
            '536'
        ],
        1
    ]);
});

test('items-across-siblings-with-fields-missing', function(assert) {
    let fields = commonFields.slice(0, commonFields.length);
    fields.push('view');
    runTest(assert, '#items-across-siblings-fields-missing', fields, [
        '552',
        [
            '553',
            '564',
            '578',
            '592',
            '606',
            '620',
            '631',
            '645',
            '656'
        ],
        1
    ]);
});

test('nested-items-with-siblings', function(assert) {
    let fields = commonFields.slice(0, commonFields.length);
    fields.push('view');
    runTest(assert, '#nested-items-with-siblings', fields, [
        '771',
        [
            '773',
            '787',
            '801',
            '816',
            '830',
            '844',
            '859',
            '873',
            '887'
        ],
        1
    ]);
});

test('items-with-field-missing-at-end', function(assert) {
    runTest(assert, '#items-with-field-missing-at-end', commonFields, [
        '672',
        [
            '673',
            '683',
            '694',
            '705',
            '716',
            '727',
            '737',
            '748',
            '758'
        ],
        0
    ]);
});

test('multiple-siblings', function(assert) {
    let fields = commonFields.slice(0, commonFields.length);
    fields.push('view');
    runTest(assert, '#multiple-siblings', fields, [
        '903',
        [
            '904',
            '921',
            '938',
            '955',
            '972',
            '989',
            '1006',
            '1023',
            '1040'
        ],
        1
    ]);
});

test('multiple-siblings-skip-element', function(assert) {
    let fields = commonFields.slice(0, commonFields.length);
    fields.push('info');
    runTest(assert, '#multiple-siblings', fields, [
        '903',
        [
            '904',
            '921',
            '938',
            '955',
            '972',
            '989',
            '1006',
            '1023',
            '1040'
        ],
        2
    ]);
});

skip('transposed-table', function(assert) {
    runTest(assert, '#transposed-table-structure', commonFields, [
        '1060',
        [
            '1062',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0'
        ],
        4
    ]);
});

test('no-elements-found', function(assert) {
    runTest(assert, '#doess-not-exist-in-page', commonFields, [
        '0',
        [],
        0
    ]);
});

var testPage = `
<!DOCTYPE html>
<html data-tagid="0">
<style data-tagid="1" type="text/css">
    .items {display: flex; border: solid;}
    .items > div {padding: 5px;}
    .spacer-row {border-left: solid;}
    html {font-size: 0.8em;}
</style>
<body data-tagid="2">
    <h2 data-tagid="3">Regular Structure</h2>
    <div data-tagid="4" id="regular-structure">
        <div data-tagid="5" class="items">
            <div data-tagid="6" id="item_0">
                <div data-tagid="7" class="image">
                    <img src="/images/0.jpg" data-tagid="8">
                </div>
                <div data-tagid="9" class="title">
                    <h3 data-tagid="10">Luxury 3 Bed Apartment</h3>
                    <div data-tagid="11" class="address">
                        <span data-tagid="12">978 Charles Street</span>
                        <span data-tagid="13">Barrington, IL 60010</span>
                    </div>
                </div>
                <div data-tagid="14" class="description">
                    <p data-tagid="15">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="16">$215000.00</span>
                </div>
            </div>

            <div data-tagid="17" id="item_1">
                <div data-tagid="18" class="image">
                    <img src="/images/1.jpg" data-tagid="19">
                </div>
                <div data-tagid="20" class="title">
                    <h3 data-tagid="21">Upscale Retirement Condo</h3>
                    <div data-tagid="22" class="address">
                        <span data-tagid="23">609 Prospect Street</span>
                        <span data-tagid="24">Rochester, NY 14606</span>
                    </div>
                </div>
                <div data-tagid="25" class="description">
                    <p data-tagid="26">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="27">$353000.00</span>
                </div>
            </div>

            <div data-tagid="28" id="item_2">
                <div data-tagid="29" class="image">
                    <img src="/images/2.jpg" data-tagid="30">
                </div>
                <div data-tagid="31" class="title">
                    <h3 data-tagid="32">Prestigious 3 Bed Home</h3>
                    <div data-tagid="33" class="address">
                        <span data-tagid="34">312 Route 29</span>
                        <span data-tagid="35">Hampton, VA 23666</span>
                    </div>
                </div>
                <div data-tagid="36" class="description">
                    <p data-tagid="37">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="38">$300000.00</span>
                </div>
            </div>

            <div data-tagid="39" id="item_3">
                <div data-tagid="40" class="image">
                    <img src="/images/3.jpg" data-tagid="41">
                </div>
                <div data-tagid="42" class="title">
                    <h3 data-tagid="43">Unique 5 Bed fixer upper</h3>
                    <div data-tagid="44" class="address">
                        <span data-tagid="45">799 Briarwood Drive</span>
                        <span data-tagid="46">Shirley, NY 11967</span>
                    </div>
                </div>
                <div data-tagid="47" class="description">
                    <p data-tagid="48">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="49">$428000.00</span>
                </div>
            </div>

            <div data-tagid="50" id="item_4">
                <div data-tagid="51" class="image">
                    <img src="/images/4.jpg" data-tagid="52">
                </div>
                <div data-tagid="53" class="title">
                    <h3 data-tagid="54">Splendid 2 Bed Duplex</h3>
                    <div data-tagid="55" class="address">
                        <span data-tagid="56">102 Tanglewood Drive</span>
                        <span data-tagid="57">East Meadow, NY 11554</span>
                    </div>
                </div>
                <div data-tagid="58" class="description">
                    <p data-tagid="59">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="60">$364000.00</span>
                </div>
            </div>

            <div data-tagid="61" id="item_5">
                <div data-tagid="62" class="image">
                    <img src="/images/5.jpg" data-tagid="63">
                </div>
                <div data-tagid="64" class="title">
                    <h3 data-tagid="65">Renovated 3 Bed Terrace</h3>
                    <div data-tagid="66" class="address">
                        <span data-tagid="67">237 Myrtle Avenue</span>
                        <span data-tagid="68">Aliquippa, PA 15001</span>
                    </div>
                </div>
                <div data-tagid="69" class="description">
                    <p data-tagid="70">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="71">$418000.00</span>
                </div>
            </div>

            <div data-tagid="72" id="item_6">
                <div data-tagid="73" class="image">
                    <img src="/images/6.jpg" data-tagid="74">
                </div>
                <div data-tagid="75" class="title">
                    <h3 data-tagid="76">Bright Studio Apartment</h3>
                    <div data-tagid="77" class="address">
                        <span data-tagid="78">117 5th Street North</span>
                        <span data-tagid="79">Copperas Cove, TX 76522</span>
                    </div>
                </div>
                <div data-tagid="80" class="description">
                    <p data-tagid="81">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="82">$552000.00</span>
                </div>
            </div>

            <div data-tagid="83" id="item_7">
                <div data-tagid="84" class="image">
                    <img src="/images/7.jpg" data-tagid="85">
                </div>
                <div data-tagid="86" class="title">
                    <h3 data-tagid="87">Detatched 4 Bed Family Residence</h3>
                    <div data-tagid="88" class="address">
                        <span data-tagid="89">46 Chestnut Street</span>
                        <span data-tagid="90">Whitestone, NY 11357</span>
                    </div>
                </div>
                <div data-tagid="91" class="description">
                    <p data-tagid="92">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="93">$586000.00</span>
                </div>
            </div>

            <div data-tagid="94" id="item_8">
                <div data-tagid="95" class="image">
                    <img src="/images/8.jpg" data-tagid="96">
                </div>
                <div data-tagid="97" class="title">
                    <h3 data-tagid="98">Superbly designed modern Townhouse</h3>
                    <div data-tagid="99" class="address">
                        <span data-tagid="100">354 Church Street South</span>
                        <span data-tagid="101">Eastlake, OH 44095</span>
                    </div>
                </div>
                <div data-tagid="102" class="description">
                    <p data-tagid="103">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="104">$342000.00</span>
                </div>
            </div>

        </div>
    </div>
    <h2 data-tagid="105">Regular Structure With additonal unimportant rows</h2>
    <div data-tagid="106" id="regular-with-unneeded-rows">
        <div data-tagid="107" class="items">
            <div data-tagid="108" id="item_0">
                <div data-tagid="109" class="image">
                    <img src="/images/0.jpg" data-tagid="110">
                </div>
                <div data-tagid="111" class="title">
                    <h3 data-tagid="112">Luxury 3 Bed Apartment</h3>
                    <div data-tagid="113" class="address">
                        <span data-tagid="114">978 Charles Street</span>
                        <span data-tagid="115">Barrington, IL 60010</span>
                    </div>
                </div>
                <div data-tagid="116" class="description">
                    <p data-tagid="117">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="118">$215000.00</span>
                </div>
            </div>
            <div data-tagid="119" class="spacer-row"><span data-tagid="120">-</span></div>
            <div data-tagid="121" id="item_1">
                <div data-tagid="122" class="image">
                    <img src="/images/1.jpg" data-tagid="123">
                </div>
                <div data-tagid="124" class="title">
                    <h3 data-tagid="125">Upscale Retirement Condo</h3>
                    <div data-tagid="126" class="address">
                        <span data-tagid="127">609 Prospect Street</span>
                        <span data-tagid="128">Rochester, NY 14606</span>
                    </div>
                </div>
                <div data-tagid="129" class="description">
                    <p data-tagid="130">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="131">$353000.00</span>
                </div>
            </div>
            <div data-tagid="132" class="spacer-row"><span data-tagid="133">-</span></div>
            <div data-tagid="134" id="item_2">
                <div data-tagid="135" class="image">
                    <img src="/images/2.jpg" data-tagid="136">
                </div>
                <div data-tagid="137" class="title">
                    <h3 data-tagid="138">Prestigious 3 Bed Home</h3>
                    <div data-tagid="139" class="address">
                        <span data-tagid="140">312 Route 29</span>
                        <span data-tagid="141">Hampton, VA 23666</span>
                    </div>
                </div>
                <div data-tagid="142" class="description">
                    <p data-tagid="143">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="144">$300000.00</span>
                </div>
            </div>
            <div data-tagid="145" class="spacer-row"><span data-tagid="146">-</span></div>
            <div data-tagid="147" id="item_3">
                <div data-tagid="148" class="image">
                    <img src="/images/3.jpg" data-tagid="149">
                </div>
                <div data-tagid="150" class="title">
                    <h3 data-tagid="151">Unique 5 Bed fixer upper</h3>
                    <div data-tagid="152" class="address">
                        <span data-tagid="153">799 Briarwood Drive</span>
                        <span data-tagid="154">Shirley, NY 11967</span>
                    </div>
                </div>
                <div data-tagid="155" class="description">
                    <p data-tagid="156">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="157">$428000.00</span>
                </div>
            </div>
            <div data-tagid="158" class="spacer-row"><span data-tagid="159">-</span></div>
            <div data-tagid="160" id="item_4">
                <div data-tagid="161" class="image">
                    <img src="/images/4.jpg" data-tagid="162">
                </div>
                <div data-tagid="163" class="title">
                    <h3 data-tagid="164">Splendid 2 Bed Duplex</h3>
                    <div data-tagid="165" class="address">
                        <span data-tagid="166">102 Tanglewood Drive</span>
                        <span data-tagid="167">East Meadow, NY 11554</span>
                    </div>
                </div>
                <div data-tagid="168" class="description">
                    <p data-tagid="169">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="170">$364000.00</span>
                </div>
            </div>
            <div data-tagid="171" class="spacer-row"><span data-tagid="172">-</span></div>
            <div data-tagid="173" id="item_5">
                <div data-tagid="174" class="image">
                    <img src="/images/5.jpg" data-tagid="175">
                </div>
                <div data-tagid="176" class="title">
                    <h3 data-tagid="177">Renovated 3 Bed Terrace</h3>
                    <div data-tagid="178" class="address">
                        <span data-tagid="179">237 Myrtle Avenue</span>
                        <span data-tagid="180">Aliquippa, PA 15001</span>
                    </div>
                </div>
                <div data-tagid="181" class="description">
                    <p data-tagid="182">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="183">$418000.00</span>
                </div>
            </div>
            <div data-tagid="184" class="spacer-row"><span data-tagid="185">-</span></div>
            <div data-tagid="186" id="item_6">
                <div data-tagid="187" class="image">
                    <img src="/images/6.jpg" data-tagid="188">
                </div>
                <div data-tagid="189" class="title">
                    <h3 data-tagid="190">Bright Studio Apartment</h3>
                    <div data-tagid="191" class="address">
                        <span data-tagid="192">117 5th Street North</span>
                        <span data-tagid="193">Copperas Cove, TX 76522</span>
                    </div>
                </div>
                <div data-tagid="194" class="description">
                    <p data-tagid="195">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="196">$552000.00</span>
                </div>
            </div>
            <div data-tagid="197" class="spacer-row"><span data-tagid="198">-</span></div>
            <div data-tagid="199" id="item_7">
                <div data-tagid="200" class="image">
                    <img src="/images/7.jpg" data-tagid="201">
                </div>
                <div data-tagid="202" class="title">
                    <h3 data-tagid="203">Detatched 4 Bed Family Residence</h3>
                    <div data-tagid="204" class="address">
                        <span data-tagid="205">46 Chestnut Street</span>
                        <span data-tagid="206">Whitestone, NY 11357</span>
                    </div>
                </div>
                <div data-tagid="207" class="description">
                    <p data-tagid="208">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="209">$586000.00</span>
                </div>
            </div>
            <div data-tagid="210" class="spacer-row"><span data-tagid="211">-</span></div>
            <div data-tagid="212" id="item_8">
                <div data-tagid="213" class="image">
                    <img src="/images/8.jpg" data-tagid="214">
                </div>
                <div data-tagid="215" class="title">
                    <h3 data-tagid="216">Superbly designed modern Townhouse</h3>
                    <div data-tagid="217" class="address">
                        <span data-tagid="218">354 Church Street South</span>
                        <span data-tagid="219">Eastlake, OH 44095</span>
                    </div>
                </div>
                <div data-tagid="220" class="description">
                    <p data-tagid="221">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="222">$342000.00</span>
                </div>
            </div>

        </div>
    </div>
    <h2 data-tagid="223">Nested Rows and Columns</h2>
    <div data-tagid="224" id="nested-rows-and-columns">
        <div data-tagid="225" class="items">
            <div data-tagid="226" class="row">
                <div data-tagid="227" id="item_0">
                    <div data-tagid="228" class="image">
                        <img src="/images/0.jpg" data-tagid="229">
                    </div>
                    <div data-tagid="230" class="title">
                        <h3 data-tagid="231">Luxury 3 Bed Apartment</h3>
                        <div data-tagid="232" class="address">
                            <span data-tagid="233">978 Charles Street</span>
                            <span data-tagid="234">Barrington, IL 60010</span>
                        </div>
                    </div>
                    <div data-tagid="235" class="description">
                        <p data-tagid="236">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="237">$215000.00</span>
                    </div>
                </div>

                <div data-tagid="238" id="item_1">
                    <div data-tagid="239" class="image">
                        <img src="/images/1.jpg" data-tagid="240">
                    </div>
                    <div data-tagid="241" class="title">
                        <h3 data-tagid="242">Upscale Retirement Condo</h3>
                        <div data-tagid="243" class="address">
                            <span data-tagid="244">609 Prospect Street</span>
                            <span data-tagid="245">Rochester, NY 14606</span>
                        </div>
                    </div>
                    <div data-tagid="246" class="description">
                        <p data-tagid="247">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="248">$353000.00</span>
                    </div>
                </div>

                <div data-tagid="249" id="item_2">
                    <div data-tagid="250" class="image">
                        <img src="/images/2.jpg" data-tagid="251">
                    </div>
                    <div data-tagid="252" class="title">
                        <h3 data-tagid="253">Prestigious 3 Bed Home</h3>
                        <div data-tagid="254" class="address">
                            <span data-tagid="255">312 Route 29</span>
                            <span data-tagid="256">Hampton, VA 23666</span>
                        </div>
                    </div>
                    <div data-tagid="257" class="description">
                        <p data-tagid="258">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="259">$300000.00</span>
                    </div>
                </div>

            </div>

            <div data-tagid="260" class="row">
                <div data-tagid="261" id="item_3">
                    <div data-tagid="262" class="image">
                        <img src="/images/3.jpg" data-tagid="263">
                    </div>
                    <div data-tagid="264" class="title">
                        <h3 data-tagid="265">Unique 5 Bed fixer upper</h3>
                        <div data-tagid="266" class="address">
                            <span data-tagid="267">799 Briarwood Drive</span>
                            <span data-tagid="268">Shirley, NY 11967</span>
                        </div>
                    </div>
                    <div data-tagid="269" class="description">
                        <p data-tagid="270">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="271">$428000.00</span>
                    </div>
                </div>

                <div data-tagid="272" id="item_4">
                    <div data-tagid="273" class="image">
                        <img src="/images/4.jpg" data-tagid="274">
                    </div>
                    <div data-tagid="275" class="title">
                        <h3 data-tagid="276">Splendid 2 Bed Duplex</h3>
                        <div data-tagid="277" class="address">
                            <span data-tagid="278">102 Tanglewood Drive</span>
                            <span data-tagid="279">East Meadow, NY 11554</span>
                        </div>
                    </div>
                    <div data-tagid="280" class="description">
                        <p data-tagid="281">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="282">$364000.00</span>
                    </div>
                </div>

                <div data-tagid="283" id="item_5">
                    <div data-tagid="284" class="image">
                        <img src="/images/5.jpg" data-tagid="285">
                    </div>
                    <div data-tagid="286" class="title">
                        <h3 data-tagid="287">Renovated 3 Bed Terrace</h3>
                        <div data-tagid="288" class="address">
                            <span data-tagid="289">237 Myrtle Avenue</span>
                            <span data-tagid="290">Aliquippa, PA 15001</span>
                        </div>
                    </div>
                    <div data-tagid="291" class="description">
                        <p data-tagid="292">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="293">$418000.00</span>
                    </div>
                </div>

            </div>

            <div data-tagid="294" class="row">
                <div data-tagid="295" id="item_6">
                    <div data-tagid="296" class="image">
                        <img src="/images/6.jpg" data-tagid="297">
                    </div>
                    <div data-tagid="298" class="title">
                        <h3 data-tagid="299">Bright Studio Apartment</h3>
                        <div data-tagid="300" class="address">
                            <span data-tagid="301">117 5th Street North</span>
                            <span data-tagid="302">Copperas Cove, TX 76522</span>
                        </div>
                    </div>
                    <div data-tagid="303" class="description">
                        <p data-tagid="304">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="305">$552000.00</span>
                    </div>
                </div>

                <div data-tagid="306" id="item_7">
                    <div data-tagid="307" class="image">
                        <img src="/images/7.jpg" data-tagid="308">
                    </div>
                    <div data-tagid="309" class="title">
                        <h3 data-tagid="310">Detatched 4 Bed Family Residence</h3>
                        <div data-tagid="311" class="address">
                            <span data-tagid="312">46 Chestnut Street</span>
                            <span data-tagid="313">Whitestone, NY 11357</span>
                        </div>
                    </div>
                    <div data-tagid="314" class="description">
                        <p data-tagid="315">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="316">$586000.00</span>
                    </div>
                </div>

                <div data-tagid="317" id="item_8">
                    <div data-tagid="318" class="image">
                        <img src="/images/8.jpg" data-tagid="319">
                    </div>
                    <div data-tagid="320" class="title">
                        <h3 data-tagid="321">Superbly designed modern Townhouse</h3>
                        <div data-tagid="322" class="address">
                            <span data-tagid="323">354 Church Street South</span>
                            <span data-tagid="324">Eastlake, OH 44095</span>
                        </div>
                    </div>
                    <div data-tagid="325" class="description">
                        <p data-tagid="326">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="327">$342000.00</span>
                    </div>
                </div>

            </div>

        </div>
    </div>
    <h2 data-tagid="328">Items with Some Fields Missing</h2>
    <div data-tagid="329" id="items-with-some-fields-missing">
        <div data-tagid="330" class="items">
            <div data-tagid="331" id="item_0">
                <div data-tagid="332" class="image">
                    <img src="/images/0.jpg" data-tagid="333">
                </div>
                <div data-tagid="334" class="title">
                    <h3 data-tagid="335">Luxury 3 Bed Apartment</h3>
                </div>
                <div data-tagid="336" class="description">
                    <p data-tagid="337">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="338">$215000.00</span>
                </div>
            </div>

            <div data-tagid="339" id="item_1">
                <div data-tagid="340" class="image">
                    <img src="/images/1.jpg" data-tagid="341">
                </div>
                <div data-tagid="342" class="title">
                    <h3 data-tagid="343">Upscale Retirement Condo</h3>
                    <div data-tagid="344" class="address">
                        <span data-tagid="345">609 Prospect Street</span>
                        <span data-tagid="346">Rochester, NY 14606</span>
                    </div>
                </div>
                <div data-tagid="347" class="description">
                    <p data-tagid="348">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="349">$353000.00</span>
                </div>
            </div>

            <div data-tagid="350" id="item_2">
                <div data-tagid="351" class="image">
                    <img src="/images/2.jpg" data-tagid="352">
                </div>
                <div data-tagid="353" class="title">
                    <h3 data-tagid="354">Prestigious 3 Bed Home</h3>
                    <div data-tagid="355" class="address">
                        <span data-tagid="356">312 Route 29</span>
                        <span data-tagid="357">Hampton, VA 23666</span>
                    </div>
                </div>
                <div data-tagid="358" class="description">
                    <p data-tagid="359">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="360">$300000.00</span>
                </div>
            </div>

            <div data-tagid="361" id="item_3">
                <div data-tagid="362" class="image">
                    <img src="/images/3.jpg" data-tagid="363">
                </div>
                <div data-tagid="364" class="title">
                    <h3 data-tagid="365">Unique 5 Bed fixer upper</h3>
                    <div data-tagid="366" class="address">
                        <span data-tagid="367">799 Briarwood Drive</span>
                        <span data-tagid="368">Shirley, NY 11967</span>
                    </div>
                </div>
                <div data-tagid="369" class="description">
                    <p data-tagid="370">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="371">$428000.00</span>
                </div>
            </div>

            <div data-tagid="372" id="item_4">
                <div data-tagid="373" class="image">
                    <img src="/images/4.jpg" data-tagid="374">
                </div>
                <div data-tagid="375" class="title">
                    <h3 data-tagid="376">Splendid 2 Bed Duplex</h3>
                    <div data-tagid="377" class="address">
                        <span data-tagid="378">102 Tanglewood Drive</span>
                        <span data-tagid="379">East Meadow, NY 11554</span>
                    </div>
                </div>
                <div data-tagid="380" class="description">
                    <p data-tagid="381">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="382">$364000.00</span>
                </div>
            </div>

            <div data-tagid="383" id="item_5">
                <div data-tagid="384" class="image">
                    <img src="/images/5.jpg" data-tagid="385">
                </div>
                <div data-tagid="386" class="title">
                    <h3 data-tagid="387">Renovated 3 Bed Terrace</h3>
                </div>
                <div data-tagid="388" class="description">
                    <p data-tagid="389">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="390">$418000.00</span>
                </div>
            </div>

            <div data-tagid="391" id="item_6">
                <div data-tagid="392" class="image">
                    <img src="/images/6.jpg" data-tagid="393">
                </div>
                <div data-tagid="394" class="title">
                    <h3 data-tagid="395">Bright Studio Apartment</h3>
                    <div data-tagid="396" class="address">
                        <span data-tagid="397">117 5th Street North</span>
                        <span data-tagid="398">Copperas Cove, TX 76522</span>
                    </div>
                </div>
                <div data-tagid="399" class="description">
                    <p data-tagid="400">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="401">$552000.00</span>
                </div>
            </div>

            <div data-tagid="402" id="item_7">
                <div data-tagid="403" class="image">
                    <img src="/images/7.jpg" data-tagid="404">
                </div>
                <div data-tagid="405" class="title">
                    <h3 data-tagid="406">Detatched 4 Bed Family Residence</h3>
                </div>
                <div data-tagid="407" class="description">
                    <p data-tagid="408">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="409">$586000.00</span>
                </div>
            </div>

            <div data-tagid="410" id="item_8">
                <div data-tagid="411" class="image">
                    <img src="/images/8.jpg" data-tagid="412">
                </div>
                <div data-tagid="413" class="title">
                    <h3 data-tagid="414">Superbly designed modern Townhouse</h3>
                    <div data-tagid="415" class="address">
                        <span data-tagid="416">354 Church Street South</span>
                        <span data-tagid="417">Eastlake, OH 44095</span>
                    </div>
                </div>
                <div data-tagid="418" class="description">
                    <p data-tagid="419">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="420">$342000.00</span>
                </div>
            </div>

        </div>
    </div>
    <h2 data-tagid="421">Items Spread across siblings</h2>
    <div data-tagid="422" id="items-spread-across-siblings">
        <div data-tagid="423" class="items">
            <div data-tagid="424" id="item_0">
                <div data-tagid="425" class="image">
                    <img src="/images/0.jpg" data-tagid="426">
                </div>
                <div data-tagid="427" class="title">
                    <h3 data-tagid="428">Luxury 3 Bed Apartment</h3>
                    <div data-tagid="429" class="address">
                        <span data-tagid="430">978 Charles Street</span>
                        <span data-tagid="431">Barrington, IL 60010</span>
                    </div>
                </div>
                <div data-tagid="432" class="description">
                    <p data-tagid="433">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="434">$215000.00</span>
                </div>
            </div>

            <div data-tagid="435" class="views">
                <span data-tagid="436">Number of views:</span>
                <span data-tagid="437">0</span>
            </div>

            <div data-tagid="438" id="item_1">
                <div data-tagid="439" class="image">
                    <img src="/images/1.jpg" data-tagid="440">
                </div>
                <div data-tagid="441" class="title">
                    <h3 data-tagid="442">Upscale Retirement Condo</h3>
                    <div data-tagid="443" class="address">
                        <span data-tagid="444">609 Prospect Street</span>
                        <span data-tagid="445">Rochester, NY 14606</span>
                    </div>
                </div>
                <div data-tagid="446" class="description">
                    <p data-tagid="447">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="448">$353000.00</span>
                </div>
            </div>

            <div data-tagid="449" class="views">
                <span data-tagid="450">Number of views:</span>
                <span data-tagid="451">1</span>
            </div>

            <div data-tagid="452" id="item_2">
                <div data-tagid="453" class="image">
                    <img src="/images/2.jpg" data-tagid="454">
                </div>
                <div data-tagid="455" class="title">
                    <h3 data-tagid="456">Prestigious 3 Bed Home</h3>
                    <div data-tagid="457" class="address">
                        <span data-tagid="458">312 Route 29</span>
                        <span data-tagid="459">Hampton, VA 23666</span>
                    </div>
                </div>
                <div data-tagid="460" class="description">
                    <p data-tagid="461">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="462">$300000.00</span>
                </div>
            </div>

            <div data-tagid="463" class="views">
                <span data-tagid="464">Number of views:</span>
                <span data-tagid="465">2</span>
            </div>

            <div data-tagid="466" id="item_3">
                <div data-tagid="467" class="image">
                    <img src="/images/3.jpg" data-tagid="468">
                </div>
                <div data-tagid="469" class="title">
                    <h3 data-tagid="470">Unique 5 Bed fixer upper</h3>
                    <div data-tagid="471" class="address">
                        <span data-tagid="472">799 Briarwood Drive</span>
                        <span data-tagid="473">Shirley, NY 11967</span>
                    </div>
                </div>
                <div data-tagid="474" class="description">
                    <p data-tagid="475">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="476">$428000.00</span>
                </div>
            </div>

            <div data-tagid="477" class="views">
                <span data-tagid="478">Number of views:</span>
                <span data-tagid="479">3</span>
            </div>

            <div data-tagid="480" id="item_4">
                <div data-tagid="481" class="image">
                    <img src="/images/4.jpg" data-tagid="482">
                </div>
                <div data-tagid="483" class="title">
                    <h3 data-tagid="484">Splendid 2 Bed Duplex</h3>
                    <div data-tagid="485" class="address">
                        <span data-tagid="486">102 Tanglewood Drive</span>
                        <span data-tagid="487">East Meadow, NY 11554</span>
                    </div>
                </div>
                <div data-tagid="488" class="description">
                    <p data-tagid="489">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="490">$364000.00</span>
                </div>
            </div>

            <div data-tagid="491" class="views">
                <span data-tagid="492">Number of views:</span>
                <span data-tagid="493">4</span>
            </div>

            <div data-tagid="494" id="item_5">
                <div data-tagid="495" class="image">
                    <img src="/images/5.jpg" data-tagid="496">
                </div>
                <div data-tagid="497" class="title">
                    <h3 data-tagid="498">Renovated 3 Bed Terrace</h3>
                    <div data-tagid="499" class="address">
                        <span data-tagid="500">237 Myrtle Avenue</span>
                        <span data-tagid="501">Aliquippa, PA 15001</span>
                    </div>
                </div>
                <div data-tagid="502" class="description">
                    <p data-tagid="503">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="504">$418000.00</span>
                </div>
            </div>

            <div data-tagid="505" class="views">
                <span data-tagid="506">Number of views:</span>
                <span data-tagid="507">5</span>
            </div>

            <div data-tagid="508" id="item_6">
                <div data-tagid="509" class="image">
                    <img src="/images/6.jpg" data-tagid="510">
                </div>
                <div data-tagid="511" class="title">
                    <h3 data-tagid="512">Bright Studio Apartment</h3>
                    <div data-tagid="513" class="address">
                        <span data-tagid="514">117 5th Street North</span>
                        <span data-tagid="515">Copperas Cove, TX 76522</span>
                    </div>
                </div>
                <div data-tagid="516" class="description">
                    <p data-tagid="517">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="518">$552000.00</span>
                </div>
            </div>

            <div data-tagid="519" class="views">
                <span data-tagid="520">Number of views:</span>
                <span data-tagid="521">6</span>
            </div>

            <div data-tagid="522" id="item_7">
                <div data-tagid="523" class="image">
                    <img src="/images/7.jpg" data-tagid="524">
                </div>
                <div data-tagid="525" class="title">
                    <h3 data-tagid="526">Detatched 4 Bed Family Residence</h3>
                    <div data-tagid="527" class="address">
                        <span data-tagid="528">46 Chestnut Street</span>
                        <span data-tagid="529">Whitestone, NY 11357</span>
                    </div>
                </div>
                <div data-tagid="530" class="description">
                    <p data-tagid="531">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="532">$586000.00</span>
                </div>
            </div>

            <div data-tagid="533" class="views">
                <span data-tagid="534">Number of views:</span>
                <span data-tagid="535">7</span>
            </div>

            <div data-tagid="536" id="item_8">
                <div data-tagid="537" class="image">
                    <img src="/images/8.jpg" data-tagid="538">
                </div>
                <div data-tagid="539" class="title">
                    <h3 data-tagid="540">Superbly designed modern Townhouse</h3>
                    <div data-tagid="541" class="address">
                        <span data-tagid="542">354 Church Street South</span>
                        <span data-tagid="543">Eastlake, OH 44095</span>
                    </div>
                </div>
                <div data-tagid="544" class="description">
                    <p data-tagid="545">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="546">$342000.00</span>
                </div>
            </div>

            <div data-tagid="547" class="views">
                <span data-tagid="548">Number of views:</span>
                <span data-tagid="549">8</span>
            </div>

        </div>
    </div>
    <h2 data-tagid="550">Items spread across siblings with some fields missing</h2>
    <div data-tagid="551" id="items-across-siblings-fields-missing">
        <div data-tagid="552" class="items">
            <div data-tagid="553" id="item_0">
                <div data-tagid="554" class="image">
                    <img src="/images/0.jpg" data-tagid="555">
                </div>
                <div data-tagid="556" class="title">
                    <h3 data-tagid="557">Luxury 3 Bed Apartment</h3>
                </div>
                <div data-tagid="558" class="description">
                    <p data-tagid="559">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="560">$215000.00</span>
                </div>
            </div>

            <div data-tagid="561" class="views">
                <span data-tagid="562">Number of views:</span>
                <span data-tagid="563">0</span>
            </div>

            <div data-tagid="564" id="item_1">
                <div data-tagid="565" class="image">
                    <img src="/images/1.jpg" data-tagid="566">
                </div>
                <div data-tagid="567" class="title">
                    <h3 data-tagid="568">Upscale Retirement Condo</h3>
                    <div data-tagid="569" class="address">
                        <span data-tagid="570">609 Prospect Street</span>
                        <span data-tagid="571">Rochester, NY 14606</span>
                    </div>
                </div>
                <div data-tagid="572" class="description">
                    <p data-tagid="573">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="574">$353000.00</span>
                </div>
            </div>

            <div data-tagid="575" class="views">
                <span data-tagid="576">Number of views:</span>
                <span data-tagid="577">1</span>
            </div>

            <div data-tagid="578" id="item_2">
                <div data-tagid="579" class="image">
                    <img src="/images/2.jpg" data-tagid="580">
                </div>
                <div data-tagid="581" class="title">
                    <h3 data-tagid="582">Prestigious 3 Bed Home</h3>
                    <div data-tagid="583" class="address">
                        <span data-tagid="584">312 Route 29</span>
                        <span data-tagid="585">Hampton, VA 23666</span>
                    </div>
                </div>
                <div data-tagid="586" class="description">
                    <p data-tagid="587">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="588">$300000.00</span>
                </div>
            </div>

            <div data-tagid="589" class="views">
                <span data-tagid="590">Number of views:</span>
                <span data-tagid="591">2</span>
            </div>

            <div data-tagid="592" id="item_3">
                <div data-tagid="593" class="image">
                    <img src="/images/3.jpg" data-tagid="594">
                </div>
                <div data-tagid="595" class="title">
                    <h3 data-tagid="596">Unique 5 Bed fixer upper</h3>
                    <div data-tagid="597" class="address">
                        <span data-tagid="598">799 Briarwood Drive</span>
                        <span data-tagid="599">Shirley, NY 11967</span>
                    </div>
                </div>
                <div data-tagid="600" class="description">
                    <p data-tagid="601">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="602">$428000.00</span>
                </div>
            </div>

            <div data-tagid="603" class="views">
                <span data-tagid="604">Number of views:</span>
                <span data-tagid="605">3</span>
            </div>

            <div data-tagid="606" id="item_4">
                <div data-tagid="607" class="image">
                    <img src="/images/4.jpg" data-tagid="608">
                </div>
                <div data-tagid="609" class="title">
                    <h3 data-tagid="610">Splendid 2 Bed Duplex</h3>
                    <div data-tagid="611" class="address">
                        <span data-tagid="612">102 Tanglewood Drive</span>
                        <span data-tagid="613">East Meadow, NY 11554</span>
                    </div>
                </div>
                <div data-tagid="614" class="description">
                    <p data-tagid="615">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="616">$364000.00</span>
                </div>
            </div>

            <div data-tagid="617" class="views">
                <span data-tagid="618">Number of views:</span>
                <span data-tagid="619">4</span>
            </div>

            <div data-tagid="620" id="item_5">
                <div data-tagid="621" class="image">
                    <img src="/images/5.jpg" data-tagid="622">
                </div>
                <div data-tagid="623" class="title">
                    <h3 data-tagid="624">Renovated 3 Bed Terrace</h3>
                </div>
                <div data-tagid="625" class="description">
                    <p data-tagid="626">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="627">$418000.00</span>
                </div>
            </div>

            <div data-tagid="628" class="views">
                <span data-tagid="629">Number of views:</span>
                <span data-tagid="630">5</span>
            </div>

            <div data-tagid="631" id="item_6">
                <div data-tagid="632" class="image">
                    <img src="/images/6.jpg" data-tagid="633">
                </div>
                <div data-tagid="634" class="title">
                    <h3 data-tagid="635">Bright Studio Apartment</h3>
                    <div data-tagid="636" class="address">
                        <span data-tagid="637">117 5th Street North</span>
                        <span data-tagid="638">Copperas Cove, TX 76522</span>
                    </div>
                </div>
                <div data-tagid="639" class="description">
                    <p data-tagid="640">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="641">$552000.00</span>
                </div>
            </div>

            <div data-tagid="642" class="views">
                <span data-tagid="643">Number of views:</span>
                <span data-tagid="644">6</span>
            </div>

            <div data-tagid="645" id="item_7">
                <div data-tagid="646" class="image">
                    <img src="/images/7.jpg" data-tagid="647">
                </div>
                <div data-tagid="648" class="title">
                    <h3 data-tagid="649">Detatched 4 Bed Family Residence</h3>
                </div>
                <div data-tagid="650" class="description">
                    <p data-tagid="651">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="652">$586000.00</span>
                </div>
            </div>

            <div data-tagid="653" class="views">
                <span data-tagid="654">Number of views:</span>
                <span data-tagid="655">7</span>
            </div>

            <div data-tagid="656" id="item_8">
                <div data-tagid="657" class="image">
                    <img src="/images/8.jpg" data-tagid="658">
                </div>
                <div data-tagid="659" class="title">
                    <h3 data-tagid="660">Superbly designed modern Townhouse</h3>
                    <div data-tagid="661" class="address">
                        <span data-tagid="662">354 Church Street South</span>
                        <span data-tagid="663">Eastlake, OH 44095</span>
                    </div>
                </div>
                <div data-tagid="664" class="description">
                    <p data-tagid="665">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="666">$342000.00</span>
                </div>
            </div>

            <div data-tagid="667" class="views">
                <span data-tagid="668">Number of views:</span>
                <span data-tagid="669">8</span>
            </div>

        </div>
    </div>
    <h2 data-tagid="670">Items with Some Field Missing at End</h2>
    <div data-tagid="671" id="items-with-field-missing-at-end">
        <div data-tagid="672" class="items">
            <div data-tagid="673" id="item_0">
                <div data-tagid="674" class="image">
                    <img src="/images/0.jpg" data-tagid="675">
                </div>
                <div data-tagid="676" class="title">
                    <h3 data-tagid="677">Luxury 3 Bed Apartment</h3>
                    <div data-tagid="678" class="address">
                        <span data-tagid="679">978 Charles Street</span>
                        <span data-tagid="680">Barrington, IL 60010</span>
                    </div>
                </div>
                <div data-tagid="681" class="description">
                    <p data-tagid="682">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                </div>
            </div>

            <div data-tagid="683" id="item_1">
                <div data-tagid="684" class="image">
                    <img src="/images/1.jpg" data-tagid="685">
                </div>
                <div data-tagid="686" class="title">
                    <h3 data-tagid="687">Upscale Retirement Condo</h3>
                    <div data-tagid="688" class="address">
                        <span data-tagid="689">609 Prospect Street</span>
                        <span data-tagid="690">Rochester, NY 14606</span>
                    </div>
                </div>
                <div data-tagid="691" class="description">
                    <p data-tagid="692">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="693">$353000.00</span>
                </div>
            </div>

            <div data-tagid="694" id="item_2">
                <div data-tagid="695" class="image">
                    <img src="/images/2.jpg" data-tagid="696">
                </div>
                <div data-tagid="697" class="title">
                    <h3 data-tagid="698">Prestigious 3 Bed Home</h3>
                    <div data-tagid="699" class="address">
                        <span data-tagid="700">312 Route 29</span>
                        <span data-tagid="701">Hampton, VA 23666</span>
                    </div>
                </div>
                <div data-tagid="702" class="description">
                    <p data-tagid="703">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="704">$300000.00</span>
                </div>
            </div>

            <div data-tagid="705" id="item_3">
                <div data-tagid="706" class="image">
                    <img src="/images/3.jpg" data-tagid="707">
                </div>
                <div data-tagid="708" class="title">
                    <h3 data-tagid="709">Unique 5 Bed fixer upper</h3>
                    <div data-tagid="710" class="address">
                        <span data-tagid="711">799 Briarwood Drive</span>
                        <span data-tagid="712">Shirley, NY 11967</span>
                    </div>
                </div>
                <div data-tagid="713" class="description">
                    <p data-tagid="714">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="715">$428000.00</span>
                </div>
            </div>

            <div data-tagid="716" id="item_4">
                <div data-tagid="717" class="image">
                    <img src="/images/4.jpg" data-tagid="718">
                </div>
                <div data-tagid="719" class="title">
                    <h3 data-tagid="720">Splendid 2 Bed Duplex</h3>
                    <div data-tagid="721" class="address">
                        <span data-tagid="722">102 Tanglewood Drive</span>
                        <span data-tagid="723">East Meadow, NY 11554</span>
                    </div>
                </div>
                <div data-tagid="724" class="description">
                    <p data-tagid="725">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="726">$364000.00</span>
                </div>
            </div>

            <div data-tagid="727" id="item_5">
                <div data-tagid="728" class="image">
                    <img src="/images/5.jpg" data-tagid="729">
                </div>
                <div data-tagid="730" class="title">
                    <h3 data-tagid="731">Renovated 3 Bed Terrace</h3>
                    <div data-tagid="732" class="address">
                        <span data-tagid="733">237 Myrtle Avenue</span>
                        <span data-tagid="734">Aliquippa, PA 15001</span>
                    </div>
                </div>
                <div data-tagid="735" class="description">
                    <p data-tagid="736">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                </div>
            </div>

            <div data-tagid="737" id="item_6">
                <div data-tagid="738" class="image">
                    <img src="/images/6.jpg" data-tagid="739">
                </div>
                <div data-tagid="740" class="title">
                    <h3 data-tagid="741">Bright Studio Apartment</h3>
                    <div data-tagid="742" class="address">
                        <span data-tagid="743">117 5th Street North</span>
                        <span data-tagid="744">Copperas Cove, TX 76522</span>
                    </div>
                </div>
                <div data-tagid="745" class="description">
                    <p data-tagid="746">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="747">$552000.00</span>
                </div>
            </div>

            <div data-tagid="748" id="item_7">
                <div data-tagid="749" class="image">
                    <img src="/images/7.jpg" data-tagid="750">
                </div>
                <div data-tagid="751" class="title">
                    <h3 data-tagid="752">Detatched 4 Bed Family Residence</h3>
                    <div data-tagid="753" class="address">
                        <span data-tagid="754">46 Chestnut Street</span>
                        <span data-tagid="755">Whitestone, NY 11357</span>
                    </div>
                </div>
                <div data-tagid="756" class="description">
                    <p data-tagid="757">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                </div>
            </div>

            <div data-tagid="758" id="item_8">
                <div data-tagid="759" class="image">
                    <img src="/images/8.jpg" data-tagid="760">
                </div>
                <div data-tagid="761" class="title">
                    <h3 data-tagid="762">Superbly designed modern Townhouse</h3>
                    <div data-tagid="763" class="address">
                        <span data-tagid="764">354 Church Street South</span>
                        <span data-tagid="765">Eastlake, OH 44095</span>
                    </div>
                </div>
                <div data-tagid="766" class="description">
                    <p data-tagid="767">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="768">$342000.00</span>
                </div>
            </div>

        </div>
    </div>
    <h2 data-tagid="769">Nested items with internal siblings</h2>
    <div data-tagid="770" id="nested-items-with-siblings">
        <div data-tagid="771" class="items">
            <div data-tagid="772" class="row">
                <div data-tagid="773" id="item_0">
                    <div data-tagid="774" class="image">
                        <img src="/images/0.jpg" data-tagid="775">
                    </div>
                    <div data-tagid="776" class="title">
                        <h3 data-tagid="777">Luxury 3 Bed Apartment</h3>
                        <div data-tagid="778" class="address">
                            <span data-tagid="779">978 Charles Street</span>
                            <span data-tagid="780">Barrington, IL 60010</span>
                        </div>
                    </div>
                    <div data-tagid="781" class="description">
                        <p data-tagid="782">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="783">$215000.00</span>
                    </div>
                </div>

                <div data-tagid="784" class="views">
                    <span data-tagid="785">Number of views:</span>
                    <span data-tagid="786">0</span>
                </div>

                <div data-tagid="787" id="item_1">
                    <div data-tagid="788" class="image">
                        <img src="/images/1.jpg" data-tagid="789">
                    </div>
                    <div data-tagid="790" class="title">
                        <h3 data-tagid="791">Upscale Retirement Condo</h3>
                        <div data-tagid="792" class="address">
                            <span data-tagid="793">609 Prospect Street</span>
                            <span data-tagid="794">Rochester, NY 14606</span>
                        </div>
                    </div>
                    <div data-tagid="795" class="description">
                        <p data-tagid="796">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="797">$353000.00</span>
                    </div>
                </div>

                <div data-tagid="798" class="views">
                    <span data-tagid="799">Number of views:</span>
                    <span data-tagid="800">1</span>
                </div>

                <div data-tagid="801" id="item_2">
                    <div data-tagid="802" class="image">
                        <img src="/images/2.jpg" data-tagid="803">
                    </div>
                    <div data-tagid="804" class="title">
                        <h3 data-tagid="805">Prestigious 3 Bed Home</h3>
                        <div data-tagid="806" class="address">
                            <span data-tagid="807">312 Route 29</span>
                            <span data-tagid="808">Hampton, VA 23666</span>
                        </div>
                    </div>
                    <div data-tagid="809" class="description">
                        <p data-tagid="810">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="811">$300000.00</span>
                    </div>
                </div>

                <div data-tagid="812" class="views">
                    <span data-tagid="813">Number of views:</span>
                    <span data-tagid="814">2</span>
                </div>

            </div>

            <div data-tagid="815" class="row">
                <div data-tagid="816" id="item_3">
                    <div data-tagid="817" class="image">
                        <img src="/images/3.jpg" data-tagid="818">
                    </div>
                    <div data-tagid="819" class="title">
                        <h3 data-tagid="820">Unique 5 Bed fixer upper</h3>
                        <div data-tagid="821" class="address">
                            <span data-tagid="822">799 Briarwood Drive</span>
                            <span data-tagid="823">Shirley, NY 11967</span>
                        </div>
                    </div>
                    <div data-tagid="824" class="description">
                        <p data-tagid="825">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="826">$428000.00</span>
                    </div>
                </div>

                <div data-tagid="827" class="views">
                    <span data-tagid="828">Number of views:</span>
                    <span data-tagid="829">0</span>
                </div>

                <div data-tagid="830" id="item_4">
                    <div data-tagid="831" class="image">
                        <img src="/images/4.jpg" data-tagid="832">
                    </div>
                    <div data-tagid="833" class="title">
                        <h3 data-tagid="834">Splendid 2 Bed Duplex</h3>
                        <div data-tagid="835" class="address">
                            <span data-tagid="836">102 Tanglewood Drive</span>
                            <span data-tagid="837">East Meadow, NY 11554</span>
                        </div>
                    </div>
                    <div data-tagid="838" class="description">
                        <p data-tagid="839">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="840">$364000.00</span>
                    </div>
                </div>

                <div data-tagid="841" class="views">
                    <span data-tagid="842">Number of views:</span>
                    <span data-tagid="843">1</span>
                </div>

                <div data-tagid="844" id="item_5">
                    <div data-tagid="845" class="image">
                        <img src="/images/5.jpg" data-tagid="846">
                    </div>
                    <div data-tagid="847" class="title">
                        <h3 data-tagid="848">Renovated 3 Bed Terrace</h3>
                        <div data-tagid="849" class="address">
                            <span data-tagid="850">237 Myrtle Avenue</span>
                            <span data-tagid="851">Aliquippa, PA 15001</span>
                        </div>
                    </div>
                    <div data-tagid="852" class="description">
                        <p data-tagid="853">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="854">$418000.00</span>
                    </div>
                </div>

                <div data-tagid="855" class="views">
                    <span data-tagid="856">Number of views:</span>
                    <span data-tagid="857">2</span>
                </div>

            </div>

            <div data-tagid="858" class="row">
                <div data-tagid="859" id="item_6">
                    <div data-tagid="860" class="image">
                        <img src="/images/6.jpg" data-tagid="861">
                    </div>
                    <div data-tagid="862" class="title">
                        <h3 data-tagid="863">Bright Studio Apartment</h3>
                        <div data-tagid="864" class="address">
                            <span data-tagid="865">117 5th Street North</span>
                            <span data-tagid="866">Copperas Cove, TX 76522</span>
                        </div>
                    </div>
                    <div data-tagid="867" class="description">
                        <p data-tagid="868">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="869">$552000.00</span>
                    </div>
                </div>

                <div data-tagid="870" class="views">
                    <span data-tagid="871">Number of views:</span>
                    <span data-tagid="872">0</span>
                </div>

                <div data-tagid="873" id="item_7">
                    <div data-tagid="874" class="image">
                        <img src="/images/7.jpg" data-tagid="875">
                    </div>
                    <div data-tagid="876" class="title">
                        <h3 data-tagid="877">Detatched 4 Bed Family Residence</h3>
                        <div data-tagid="878" class="address">
                            <span data-tagid="879">46 Chestnut Street</span>
                            <span data-tagid="880">Whitestone, NY 11357</span>
                        </div>
                    </div>
                    <div data-tagid="881" class="description">
                        <p data-tagid="882">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="883">$586000.00</span>
                    </div>
                </div>

                <div data-tagid="884" class="views">
                    <span data-tagid="885">Number of views:</span>
                    <span data-tagid="886">1</span>
                </div>

                <div data-tagid="887" id="item_8">
                    <div data-tagid="888" class="image">
                        <img src="/images/8.jpg" data-tagid="889">
                    </div>
                    <div data-tagid="890" class="title">
                        <h3 data-tagid="891">Superbly designed modern Townhouse</h3>
                        <div data-tagid="892" class="address">
                            <span data-tagid="893">354 Church Street South</span>
                            <span data-tagid="894">Eastlake, OH 44095</span>
                        </div>
                    </div>
                    <div data-tagid="895" class="description">
                        <p data-tagid="896">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                        <span data-tagid="897">$342000.00</span>
                    </div>
                </div>

                <div data-tagid="898" class="views">
                    <span data-tagid="899">Number of views:</span>
                    <span data-tagid="900">2</span>
                </div>

            </div>

        </div>
    </div>
    <h2 data-tagid="901">Items spread across multiple siblings</h2>
    <div data-tagid="902" id="multiple-siblings">
        <div data-tagid="903" class="items">
            <div data-tagid="904" id="item_0">
                <div data-tagid="905" class="image">
                    <img src="/images/0.jpg" data-tagid="906">
                </div>
                <div data-tagid="907" class="title">
                    <h3 data-tagid="908">Luxury 3 Bed Apartment</h3>
                    <div data-tagid="909" class="address">
                        <span data-tagid="910">978 Charles Street</span>
                        <span data-tagid="911">Barrington, IL 60010</span>
                    </div>
                </div>
                <div data-tagid="912" class="description">
                    <p data-tagid="913">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="914">$215000.00</span>
                </div>
            </div>

            <div data-tagid="915" class="views">
                <span data-tagid="916">Number of views:</span>
                <span data-tagid="917">0</span>
            </div>

            <div data-tagid="918" class="info">
                <span data-tagid="919">Posted on:</span>
                <span data-tagid="920">January 06 2016</span>
            </div>

            <div data-tagid="921" id="item_1">
                <div data-tagid="922" class="image">
                    <img src="/images/1.jpg" data-tagid="923">
                </div>
                <div data-tagid="924" class="title">
                    <h3 data-tagid="925">Upscale Retirement Condo</h3>
                    <div data-tagid="926" class="address">
                        <span data-tagid="927">609 Prospect Street</span>
                        <span data-tagid="928">Rochester, NY 14606</span>
                    </div>
                </div>
                <div data-tagid="929" class="description">
                    <p data-tagid="930">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="931">$353000.00</span>
                </div>
            </div>

            <div data-tagid="932" class="views">
                <span data-tagid="933">Number of views:</span>
                <span data-tagid="934">1</span>
            </div>

            <div data-tagid="935" class="info">
                <span data-tagid="936">Posted on:</span>
                <span data-tagid="937">January 02 2016</span>
            </div>

            <div data-tagid="938" id="item_2">
                <div data-tagid="939" class="image">
                    <img src="/images/2.jpg" data-tagid="940">
                </div>
                <div data-tagid="941" class="title">
                    <h3 data-tagid="942">Prestigious 3 Bed Home</h3>
                    <div data-tagid="943" class="address">
                        <span data-tagid="944">312 Route 29</span>
                        <span data-tagid="945">Hampton, VA 23666</span>
                    </div>
                </div>
                <div data-tagid="946" class="description">
                    <p data-tagid="947">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="948">$300000.00</span>
                </div>
            </div>

            <div data-tagid="949" class="views">
                <span data-tagid="950">Number of views:</span>
                <span data-tagid="951">2</span>
            </div>

            <div data-tagid="952" class="info">
                <span data-tagid="953">Posted on:</span>
                <span data-tagid="954">December 22 2015</span>
            </div>

            <div data-tagid="955" id="item_3">
                <div data-tagid="956" class="image">
                    <img src="/images/3.jpg" data-tagid="957">
                </div>
                <div data-tagid="958" class="title">
                    <h3 data-tagid="959">Unique 5 Bed fixer upper</h3>
                    <div data-tagid="960" class="address">
                        <span data-tagid="961">799 Briarwood Drive</span>
                        <span data-tagid="962">Shirley, NY 11967</span>
                    </div>
                </div>
                <div data-tagid="963" class="description">
                    <p data-tagid="964">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="965">$428000.00</span>
                </div>
            </div>

            <div data-tagid="966" class="views">
                <span data-tagid="967">Number of views:</span>
                <span data-tagid="968">3</span>
            </div>

            <div data-tagid="969" class="info">
                <span data-tagid="970">Posted on:</span>
                <span data-tagid="971">December 15 2015</span>
            </div>

            <div data-tagid="972" id="item_4">
                <div data-tagid="973" class="image">
                    <img src="/images/4.jpg" data-tagid="974">
                </div>
                <div data-tagid="975" class="title">
                    <h3 data-tagid="976">Splendid 2 Bed Duplex</h3>
                    <div data-tagid="977" class="address">
                        <span data-tagid="978">102 Tanglewood Drive</span>
                        <span data-tagid="979">East Meadow, NY 11554</span>
                    </div>
                </div>
                <div data-tagid="980" class="description">
                    <p data-tagid="981">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="982">$364000.00</span>
                </div>
            </div>

            <div data-tagid="983" class="views">
                <span data-tagid="984">Number of views:</span>
                <span data-tagid="985">4</span>
            </div>

            <div data-tagid="986" class="info">
                <span data-tagid="987">Posted on:</span>
                <span data-tagid="988">December 12 2015</span>
            </div>

            <div data-tagid="989" id="item_5">
                <div data-tagid="990" class="image">
                    <img src="/images/5.jpg" data-tagid="991">
                </div>
                <div data-tagid="992" class="title">
                    <h3 data-tagid="993">Renovated 3 Bed Terrace</h3>
                    <div data-tagid="994" class="address">
                        <span data-tagid="995">237 Myrtle Avenue</span>
                        <span data-tagid="996">Aliquippa, PA 15001</span>
                    </div>
                </div>
                <div data-tagid="997" class="description">
                    <p data-tagid="998">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="999">$418000.00</span>
                </div>
            </div>

            <div data-tagid="1000" class="views">
                <span data-tagid="1001">Number of views:</span>
                <span data-tagid="1002">5</span>
            </div>

            <div data-tagid="1003" class="info">
                <span data-tagid="1004">Posted on:</span>
                <span data-tagid="1005">January 03 2016</span>
            </div>

            <div data-tagid="1006" id="item_6">
                <div data-tagid="1007" class="image">
                    <img src="/images/6.jpg" data-tagid="1008">
                </div>
                <div data-tagid="1009" class="title">
                    <h3 data-tagid="1010">Bright Studio Apartment</h3>
                    <div data-tagid="1011" class="address">
                        <span data-tagid="1012">117 5th Street North</span>
                        <span data-tagid="1013">Copperas Cove, TX 76522</span>
                    </div>
                </div>
                <div data-tagid="1014" class="description">
                    <p data-tagid="1015">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="1016">$552000.00</span>
                </div>
            </div>

            <div data-tagid="1017" class="views">
                <span data-tagid="1018">Number of views:</span>
                <span data-tagid="1019">6</span>
            </div>

            <div data-tagid="1020" class="info">
                <span data-tagid="1021">Posted on:</span>
                <span data-tagid="1022">December 23 2015</span>
            </div>

            <div data-tagid="1023" id="item_7">
                <div data-tagid="1024" class="image">
                    <img src="/images/7.jpg" data-tagid="1025">
                </div>
                <div data-tagid="1026" class="title">
                    <h3 data-tagid="1027">Detatched 4 Bed Family Residence</h3>
                    <div data-tagid="1028" class="address">
                        <span data-tagid="1029">46 Chestnut Street</span>
                        <span data-tagid="1030">Whitestone, NY 11357</span>
                    </div>
                </div>
                <div data-tagid="1031" class="description">
                    <p data-tagid="1032">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="1033">$586000.00</span>
                </div>
            </div>

            <div data-tagid="1034" class="views">
                <span data-tagid="1035">Number of views:</span>
                <span data-tagid="1036">7</span>
            </div>

            <div data-tagid="1037" class="info">
                <span data-tagid="1038">Posted on:</span>
                <span data-tagid="1039">January 03 2016</span>
            </div>

            <div data-tagid="1040" id="item_8">
                <div data-tagid="1041" class="image">
                    <img src="/images/8.jpg" data-tagid="1042">
                </div>
                <div data-tagid="1043" class="title">
                    <h3 data-tagid="1044">Superbly designed modern Townhouse</h3>
                    <div data-tagid="1045" class="address">
                        <span data-tagid="1046">354 Church Street South</span>
                        <span data-tagid="1047">Eastlake, OH 44095</span>
                    </div>
                </div>
                <div data-tagid="1048" class="description">
                    <p data-tagid="1049">
                         Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                    </p>
                    <span data-tagid="1050">$342000.00</span>
                </div>
            </div>

            <div data-tagid="1051" class="views">
                <span data-tagid="1052">Number of views:</span>
                <span data-tagid="1053">8</span>
            </div>

            <div data-tagid="1054" class="info">
                <span data-tagid="1055">Posted on:</span>
                <span data-tagid="1056">January 05 2016</span>
            </div>

        </div>
    </div>
    <h2 data-tagid="1057">Transposed Table Structure</h2>
    <div data-tagid="1058" id="transposed-table-structure">
        <div data-tagid="1059">
            <table data-tagid="1060" class="table">
                <tr data-tagid="1061">
                    <td data-tagid="1062" class="image">
                        <img src="/images/0.jpg" data-tagid="1063">
                    </td>
                    <td data-tagid="1064" class="image">
                        <img src="/images/1.jpg" data-tagid="1065">
                    </td>
                    <td data-tagid="1066" class="image">
                        <img src="/images/2.jpg" data-tagid="1067">
                    </td>
                    <td data-tagid="1068" class="image">
                        <img src="/images/3.jpg" data-tagid="1069">
                    </td>
                    <td data-tagid="1070" class="image">
                        <img src="/images/4.jpg" data-tagid="1071">
                    </td>
                    <td data-tagid="1072" class="image">
                        <img src="/images/5.jpg" data-tagid="1073">
                    </td>
                    <td data-tagid="1074" class="image">
                        <img src="/images/6.jpg" data-tagid="1075">
                    </td>
                    <td data-tagid="1076" class="image">
                        <img src="/images/7.jpg" data-tagid="1077">
                    </td>
                    <td data-tagid="1078" class="image">
                        <img src="/images/8.jpg" data-tagid="1079">
                    </td>
                </tr>
                <tr data-tagid="1080">
                    <td data-tagid="1081" class="title">
                        <h3 data-tagid="1082">Luxury 3 Bed Apartment</h3>
                    </td>
                    <td data-tagid="1083" class="title">
                        <h3 data-tagid="1084">Upscale Retirement Condo</h3>
                    </td>
                    <td data-tagid="1085" class="title">
                        <h3 data-tagid="1086">Prestigious 3 Bed Home</h3>
                    </td>
                    <td data-tagid="1087" class="title">
                        <h3 data-tagid="1088">Unique 5 Bed fixer upper</h3>
                    </td>
                    <td data-tagid="1089" class="title">
                        <h3 data-tagid="1090">Splendid 2 Bed Duplex</h3>
                    </td>
                    <td data-tagid="1091" class="title">
                        <h3 data-tagid="1092">Renovated 3 Bed Terrace</h3>
                    </td>
                    <td data-tagid="1093" class="title">
                        <h3 data-tagid="1094">Bright Studio Apartment</h3>
                    </td>
                    <td data-tagid="1095" class="title">
                        <h3 data-tagid="1096">Detatched 4 Bed Family Residence</h3>
                    </td>
                    <td data-tagid="1097" class="title">
                        <h3 data-tagid="1098">Superbly designed modern Townhouse</h3>
                    </td>
                </tr>
                <tr data-tagid="1099">
                    <td data-tagid="1100" class="address">
                        <span data-tagid="1101">978 Charles Street</span>
                        <span data-tagid="1102">Barrington, IL 60010</span>
                    </td>
                    <td data-tagid="1103" class="address">
                        <span data-tagid="1104">609 Prospect Street</span>
                        <span data-tagid="1105">Rochester, NY 14606</span>
                    </td>
                    <td data-tagid="1106" class="address">
                        <span data-tagid="1107">312 Route 29</span>
                        <span data-tagid="1108">Hampton, VA 23666</span>
                    </td>
                    <td data-tagid="1109" class="address">
                        <span data-tagid="1110">799 Briarwood Drive</span>
                        <span data-tagid="1111">Shirley, NY 11967</span>
                    </td>
                    <td data-tagid="1112" class="address">
                        <span data-tagid="1113">102 Tanglewood Drive</span>
                        <span data-tagid="1114">East Meadow, NY 11554</span>
                    </td>
                    <td data-tagid="1115" class="address">
                        <span data-tagid="1116">237 Myrtle Avenue</span>
                        <span data-tagid="1117">Aliquippa, PA 15001</span>
                    </td>
                    <td data-tagid="1118" class="address">
                        <span data-tagid="1119">117 5th Street North</span>
                        <span data-tagid="1120">Copperas Cove, TX 76522</span>
                    </td>
                    <td data-tagid="1121" class="address">
                        <span data-tagid="1122">46 Chestnut Street</span>
                        <span data-tagid="1123">Whitestone, NY 11357</span>
                    </td>
                    <td data-tagid="1124" class="address">
                        <span data-tagid="1125">354 Church Street South</span>
                        <span data-tagid="1126">Eastlake, OH 44095</span>
                    </td>
                </tr>
                <tr data-tagid="1127">
                    <td data-tagid="1128" class="description">
                        <p data-tagid="1129">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                    </td>
                    <td data-tagid="1130" class="description">
                        <p data-tagid="1131">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                    </td>
                    <td data-tagid="1132" class="description">
                        <p data-tagid="1133">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                    </td>
                    <td data-tagid="1134" class="description">
                        <p data-tagid="1135">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                    </td>
                    <td data-tagid="1136" class="description">
                        <p data-tagid="1137">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                    </td>
                    <td data-tagid="1138" class="description">
                        <p data-tagid="1139">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                    </td>
                    <td data-tagid="1140" class="description">
                        <p data-tagid="1141">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                    </td>
                    <td data-tagid="1142" class="description">
                        <p data-tagid="1143">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                    </td>
                    <td data-tagid="1144" class="description">
                        <p data-tagid="1145">
                             Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vivamus sit amet congue.
                        </p>
                    </td>
                </tr>
                <tr data-tagid="1146">
                    <td data-tagid="1147" class="description">
                        <span data-tagid="1148">$215000.00</span>
                    </td>
                    <td data-tagid="1149" class="description">
                        <span data-tagid="1150">$353000.00</span>
                    </td>
                    <td data-tagid="1151" class="description">
                        <span data-tagid="1152">$300000.00</span>
                    </td>
                    <td data-tagid="1153" class="description">
                        <span data-tagid="1154">$428000.00</span>
                    </td>
                    <td data-tagid="1155" class="description">
                        <span data-tagid="1156">$364000.00</span>
                    </td>
                    <td data-tagid="1157" class="description">
                        <span data-tagid="1158">$418000.00</span>
                    </td>
                    <td data-tagid="1159" class="description">
                        <span data-tagid="1160">$552000.00</span>
                    </td>
                    <td data-tagid="1161" class="description">
                        <span data-tagid="1162">$586000.00</span>
                    </td>
                    <td data-tagid="1163" class="description">
                        <span data-tagid="1164">$342000.00</span>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
`;
var doc = Ember.$('<html/>').html(testPage).get(0);
