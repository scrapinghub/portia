
let cache = {};

function isEnabled(feature) {
    if(!(feature in cache)) {
        let res = window.localStorage && ("portia_enable_" + feature) in localStorage;
        cache[feature] = Boolean(res);
    }
    return cache[feature];
}

function set(feature, value) {
    if(isEnabled(feature) === value) {
        return;
    }
    try {
        if(value){
            localStorage['portia_enable_' + feature] = value;
        } else {
            delete localStorage['portia_enable_' + feature];
        }
    } catch(e) {} // Local Storage may throw errors if quota full

    // Experiments need a reload to enable/disable. We should make sure to
    // warn the user if we add a GUI to enable experiments.
    location.href = location.href;
}

// Public API
export default {
    enabled: function(feature) {
        return isEnabled(feature);
    },
    enable: function(feature) {
        set(feature, true);
    },
    disable: function(feature) {
        set(feature, false);
    },
    setEnabled: function(feature, val){
        set(feature, val);
    }
};

