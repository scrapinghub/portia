import acceptanceTest from '../helpers/acceptance-test';
import Ember from 'ember';
import { lastRequest } from '../helpers/fixtures';
import ws from '../helpers/websocket-mock';
import { waitForElement, waitFor, timeout } from '../helpers/wait';

function waitForLoad() {
    return waitFor(function(){
        return !/Loading page/.test($('.url').text());
    });
}


function baseSplashRenderTest(name, url, fn) {
    acceptanceTest("Splash Web Document " + name, function(app){
        return visit('/')
        .then(() => visit('/projects/11'))
        .then(() => visit('/projects/11/spider1'))
        .then(() => equal(currentURL(), '/projects/11/spider1'))
        .then(() => waitForElement('#scraped-doc-iframe'))
        .then(function(){
            equal(2, $('#scraped-doc-iframe').length + 1, 'Has iframe');
        })
        .then(() => waitFor(function(){
            var docView = app.registry.registrations['document:obj'].view;
            return docView.get('mode') === 'browse';
        }))
        .then(function(){
            var docView = app.registry.registrations['document:obj'].view;
            docView.loadUrl(url);
        })
        .then(() => waitForLoad())
        .then(() => timeout(1000))
        .then(() => fn.call(this, arguments) );
    });
}

/**
 * get attributes as dictionary
 */
function getAttributes(el) {
    var res = {};
    for (var i = 0, len = el.attributes.length; i < len; i++) {
        res[el.attributes[i].name] = el.attributes[i].value;
    }
    return res;
}

function domEqual(dom1, dom2, path) {
    path = path || ':root';
    if(!dom1 || !dom2) {
        return equal(dom1, dom2, path + ' Both null');
    }
    equal(dom1.nodeType, dom2.nodeType, path + ' nodeType');

    if(dom1.nodeType === window.Node.TEXT_NODE) {
        equal(dom1.nodeValue, dom2.nodeValue, path + ' nodeValue');
    } else if(dom1.nodeType === window.Node.ELEMENT_NODE) {
        equal(dom1.tagName, dom2.tagName, path + ' tagName');
        equal(dom1.children.length, dom2.children.length, path + ' child count');
        equal(dom1.attributes.length, dom2.attributes.length, path + ' attr count');
        deepEqual(getAttributes(dom1), getAttributes(dom2), path + ' attributes');
        for (var i = 0, len = dom1.children.length; i < len; i++) {
            domEqual(dom1.children[i], dom2.children[i], path + '>' + dom1.children[i].tagName);
        }
    } else if(dom1.nodeType === window.Node.DOCUMENT_NODE) {
        domEqual(dom1.documentElement, dom2.documentElement, path);
    }
}

function domTest(file) {
    var url = location.origin + '/testresources/' + file;
    baseSplashRenderTest("DOMeq " + file, url, function(){

        var directDefer = Ember.RSVP.defer();
        var $direct = $('<iframe/>').on('load', function(){
            setTimeout(directDefer.resolve, 30);
        }).attr('src', url).appendTo(document.body);

        return directDefer.promise.then(function(){
            var splash = $('#scraped-doc-iframe').contents();
            var direct = $direct.contents();

            // Attribute blacklist
            ['data-tagid', 'href', 'src'].forEach(function(attr){
                splash.find('[' + attr + ']').removeAttr(attr);
                direct.find('[' + attr + ']').removeAttr(attr);
            });

            // Tag blacklist
            ['script', 'noscript'].forEach(function(tag){
                direct.find(tag).remove();
                splash.find(tag).remove();
            });

            equal(splash.length, 1);
            equal(direct.length, 1);
            domEqual(splash[0], direct[0]);

            var bgcolortest = splash.find('.testbgcolor');
            if(bgcolortest.length) {
                equal(bgcolortest.css('background-color'), direct.find('.testbgcolor').css('background-color'));
            }
            $direct.remove();
        });
    });

 }

module('Acceptance | Web document', { });

domTest('style-tag.html');
domTest('dom-change-nodevalue.html');
domTest('dom-add-node.html');
domTest('dom-remove-node.html');
domTest('unicode-characters.html');
domTest('overwrite-natives-json.html');
domTest('overwrite-natives-json-strigify.html');
domTest('overwrite-natives-tojson.html');
// domTest('overwrite-natives-array.html'); // Broken, mutation summary and company use overwritten array prototypes
domTest('import-data-url.html');
domTest('external-css.html');
domTest('external-import-css.html');
domTest('inline-style.html');

