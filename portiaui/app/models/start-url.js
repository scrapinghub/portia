import Ember from 'ember';
import { flatten } from '../utils/utils';
import { augmentFragmentList, fragmentToString } from '../utils/start-urls';

function saveStartUrl(urlObject) {
    return function(spider) {
        spider.get('startUrls').pushObject(urlObject);
        spider.save();
        return urlObject;
    };
}

function startUrl(spec) {
    function toString() {
        return urlObject.url;
    }

    function serialize() {
        return {
            'url': urlObject.url,
            'type': urlObject.type
        };
    }

    let urlObject = { url: spec.url, type: 'url' };

    urlObject.isGenerated = false;
    urlObject.componentName = 'project-structure-spider-url';

    urlObject.save = saveStartUrl(urlObject);
    urlObject.toString = toString;
    urlObject.serialize = serialize;

    return urlObject;
}

function generatedUrl(spec) {
    function toString() {
        return urlObject.fragments.map(fragmentToString).join('');
    }

    function serialize() {
        return {
            'url': urlObject.toString(),
            'type': urlObject.type,
            'fragments': urlObject.fragments,
        };
    }

    function generateList() {
        // This algorithm is very inefficient due to concatenation and flattening.
        const fragments = Ember.copy(urlObject.fragments);
        let firstFragment = fragments.shiftObject();
        let urlList = [[firstFragment.value]];

        fragments.forEach((fragment) => {
            let augmentedList = urlList.map((fragmentList) => {
                return augmentFragmentList(fragmentList, fragment);
            });
            urlList = flatten(augmentedList);
        });
        return urlList;
    }

    let fragments = spec.fragments || [{type: 'fixed', value: spec.url}];
    let urlObject = {
        url: spec.url,
        type: 'generated',
        fragments: fragments
    };

    urlObject.isGenerated = true;
    urlObject.componentName = 'project-structure-spider-generated-url';
    urlObject.optionsComponentName = 'generated-url-options';

    urlObject.save = saveStartUrl(urlObject);
    urlObject.toString = toString;
    urlObject.serialize = serialize;
    urlObject.generateList = generateList;

    return urlObject;
}

function feedUrl(spec) {
    function toString() {
        return urlObject.url;
    }

    function serialize() {
        return {
            'url': urlObject.url,
            'type': urlObject.type
        };
    }

    let urlObject = { url: spec.url, type: 'feed' };

    urlObject.isGenerated = false;
    urlObject.componentName = 'project-structure-spider-feed-url';
    urlObject.optionsComponentName = 'feed-url-options';

    urlObject.save = saveStartUrl(urlObject);
    urlObject.toString = toString;
    urlObject.serialize = serialize;

    return urlObject;
}

export default function buildStartUrl(spec) {
    const urls = {
        'url': startUrl,
        'feed': feedUrl,
        'generated': generatedUrl
    };
    return urls[spec.type || 'url'](spec);
}
