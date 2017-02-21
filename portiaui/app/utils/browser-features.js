import Ember from 'ember';
const { RSVP } = Ember;

export default function hasBrowserFeatures() {
    // generatedcontent: detection issue with zoom in chrome
    let features = [
        "eventlistener", "json", "postmessage", "queryselector", "requestanimationframe", "svg",
        "websockets", "cssanimations", "csscalc", "flexbox", "nthchild",
        "csspointerevents", "opacity", "csstransforms", "csstransitions", "cssvhunit",
        "classlist", "placeholder", "localstorage", "svgasimg", "datauri", "atobbtoa"
    ];
    let feature_promises = features.map((feature) => {
        return new RSVP.Promise((resolve) => {
            Modernizr.on(feature, (isFeatureActive) => { resolve(isFeatureActive); });
        });
    });

    return RSVP.all(feature_promises);
}
