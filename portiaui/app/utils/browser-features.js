import Ember from 'ember';
const { RSVP } = Ember;

export default function hasBrowserFeatures() {
    let features = [
        "eventlistener", "json", "postmessage", "queryselector", "requestanimationframe", "svg",
        "websockets", "cssanimations", "csscalc", "flexbox", "generatedcontent", "nthchild",
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
