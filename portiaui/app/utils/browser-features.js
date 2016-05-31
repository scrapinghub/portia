import Ember from 'ember';
const { Promise } = Ember.RSVP;

export default function hasBrowserFeatures() {
    let features = [
        "eventlistener", "json", "postmessage", "queryselector", "requestanimationframe", "svg",
        "websockets", "cssanimations", "csscalc", "flexbox", "generatedcontent", "nthchild",
        "csspointerevents", "opacity", "csstransforms", "csstransitions", "cssvhunit",
        "classlist", "placeholder", "localstorage", "svgasimg", "datauri", "atobbtoa"
    ];

    return new Promise(function(resolve) {
        let hasFeatures = features.every((feature) => {
            return Modernizr[feature];
        });
        resolve(hasFeatures);
    });
}
