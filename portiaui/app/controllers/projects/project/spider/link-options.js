import Ember from 'ember';
import { NAMED_COLORS } from '../../../../utils/colors';

/**
 * Levenshtein distance between two arrays or strings
 */
function arrDistance(a, b) {
    if(a.length === 0) { return b.length; }
    if(b.length === 0) { return a.length; }

    var matrix = [];

    // increment along the first column of each row
    for(var i = 0; i <= b.length; i++){
        matrix[i] = [i];
    }

    // increment each column in the first row
    for(var j = 0; j <= a.length; j++){
        matrix[0][j] = j;
    }

    // Fill in the rest of the matrix
    for(i = 1; i <= b.length; i++){
        for(j = 1; j <= a.length; j++){
            if(b[i-1] === a[j-1]){
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i-1][j-1] + 1, // substitution
                    Math.min(matrix[i][j-1] + 2, // insertion
                    matrix[i-1][j] + 2) // deletion
                );
            }
        }
    }

    return matrix[b.length][a.length];
}

/**
 * Distance between two dictionaries.
 * Note: modifies dicts in-place
 */
function dictDistance(a, b){
    let distance = 0;
    for(let k in a) {
        if (a.hasOwnProperty(k) && !b.hasOwnProperty(k) || b[k] !== a[k]) {
            distance++;
        }
        delete b[k];
    }
    return distance + Object.keys(b).length;
}

/**
 * Calculates the distance between two urls, taking into account
 * the URL's syntax.
 */
function urlDistance(url1, url2) {
    let cacheKey = [url1, url2].sort().join('\n');
    if(cacheKey in urlDistance._cache) {
        return urlDistance._cache[cacheKey];
    }

    url1 = new URI(url1);
    url2 = new URI(url2);

    let distance = arrDistance(url1.segment(), url2.segment()) +
        4*arrDistance(url1.domain().split('.'), url2.domain().split('.')) +
        dictDistance(url1.search(true), url2.search(true)) +
        (url1.fragment() === url2.fragment() ? 0 : 1);
    urlDistance._cache[cacheKey] = distance;
    return distance;
}
urlDistance._cache = {};

function linkColor(url, followDomains, startUrls, nofollowExamples,
                   followDomainsAfter, startUrlsAfter, nofollowExamplesAfter) {
    let follow = willFollow(url, followDomains, startUrls, nofollowExamples);
    let followAfter = willFollow(url, followDomainsAfter, startUrlsAfter, nofollowExamplesAfter);
    if(follow === followAfter) {
        return NAMED_COLORS[followAfter ? 'light green' : 'light red'];
    } else {
        return NAMED_COLORS[followAfter ? 'green' : 'red'];
    }
}


function willFollow(url, followDomains, followExamples, nofollowExamples) {
    url = new URI(url);

    if(!followDomains.has(url.hostname())) {
        return false;
    }

    let minDistance = Number.MAX_VALUE;
    let minDistanceFollowed = true;

    for(let [follow, urllist] of [[true, followExamples], [false, nofollowExamples]]) {
        for(let other of urllist) {
            let distance = urlDistance(url, other);
            if(distance < minDistance) {
                minDistance = distance;
                minDistanceFollowed = follow;
            }
        }
    }

    return minDistanceFollowed;
}


function hostnames(urls) {
    let res = new Set();
    for(let url of urls) {
        res.add(new URI(url).hostname());
    }
    return res;
}

export default Ember.Controller.extend({
    browser: Ember.inject.service(),
    projectController: Ember.inject.controller('projects.project'),
    spiderController: Ember.inject.controller('projects.project.spider'),
    uiState: Ember.inject.service(),
    selectorMatcher: Ember.inject.service(),
    allLinks: [],
    selectedLink: null,

    updateLinkList(links) {
        this.set('allLinks', links);
    },

    updateSelectedLink(links) {
        this.set('selectedLink', links.get('lastObject'));
    },

    linkOverlayElements: Ember.computed('model.linksToFollow',
    'selectedLink', 'allLinks', 'model.startUrls',
    'model.nofollowExamples', function(){
        if(this.get('model.linksToFollow') === 'examples') {
            const start = new Date();
            const hover = this.get('selectedLink');

            const startUrls = this.get('model.startUrls');
            const followDomains = hostnames(startUrls);
            const nofollowUrls = this.get('model.nofollowExamples');

            let startUrlsAfter = [...startUrls];
            let nofollowUrlsAfter = [...nofollowUrls];

            if(hover && hover.tagName === 'A' && hover.href) {
                let hoveredUrl = hover.href;

                if(willFollow(hoveredUrl, followDomains, startUrls, nofollowUrls)) {
                    nofollowUrlsAfter.push(hoveredUrl);
                    startUrlsAfter.removeObject(hoveredUrl);
                } else {
                    nofollowUrlsAfter.removeObject(hoveredUrl);
                    startUrlsAfter.push(hoveredUrl);
                }
            }
            const followDomainsAfter = hostnames(startUrlsAfter);
            //console.log({hoveredUrl: hover && hover.href, followDomains, startUrls, nofollowUrls,
            //            followDomainsAfter,    startUrlsAfter, nofollowUrlsAfter});

            const res = this.get('allLinks').map(l => ({
                guid: Ember.guidFor(l),
                element: l,
                color: linkColor(l, followDomains, startUrls, nofollowUrls,
                                    followDomainsAfter, startUrlsAfter, nofollowUrlsAfter),
            }));
            console.log('updateLinks took', new Date() - start);
            return res;
        } else {
            return this.get('spiderController.linkOverlayElements');
        }
    }),

    linkClicked() {
        const hover = this.get('selectedLink');

        const startUrls = this.get('model.startUrls');
        const followDomains = hostnames(startUrls);
        const nofollowUrls = this.get('model.nofollowExamples');

        if(hover && hover.tagName === 'A' && hover.href) {
            let hoveredUrl = hover.href;

            if(willFollow(hoveredUrl, followDomains, startUrls, nofollowUrls)) {
                nofollowUrls.pushObject(hoveredUrl);
                startUrls.removeObject(hoveredUrl);
            } else {
                nofollowUrls.removeObject(hoveredUrl);
                startUrls.pushObject(hoveredUrl);
            }
        }
    },

    activate() {
        this.get('model').set('showLinks', true);
        this.get('browser').setAnnotationMode();
        this.get('projectController').setClickHandler(this.linkClicked.bind(this));
        this.get('selectorMatcher').register('a[href]', this, this.updateLinkList);
        this.get('selectorMatcher').register('a[href]:hover', this, this.updateSelectedLink);
    },

    deactivate() {
        this.get('projectController').clearClickHandler();
        this.get('selectorMatcher').unRegister('a[href]', this, this.updateLinkList);
        this.get('selectorMatcher').unRegister('a[href]:hover', this, this.updateSelectedLink);
    },

    actions: {
        closeOptions() {
            this.send('close');
        }
    }
});
