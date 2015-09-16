;(function(){
    function makeStorage(valueSizeLimit, keyNumberLimit){
        var keys = [];

        var storage = Object.create(Object, {
            getItem: {value: function(k) {
                if(this.hasOwnProperty(k)) {
                    return this[k];
                }
            }},
            setItem: {value: function(k, v) {
                v = String(v);
                if(v.length <= valueSizeLimit && keys.length <= keyNumberLimit) {
                    this[k] = v;
                    update();
                }
            }},
            removeItem: {value: function(k) {
                if(this.hasOwnProperty(k)) {
                    delete this[k];
                }
                update();
            }},
            clear: {value: function(){
                for(var k in this){
                    if(this.hasOwnProperty(k)) {
                        delete this[k];
                    }
                }
                keys.splice(0, keys.length);
            }},
            key: {value: function(i) {
                return keys[i];
            }},
            length: {get: function(){
                return keys.length;
            }}
        });

        var update = function() {
            keys.splice(0, keys.length);
            for(var k in storage){
                if(storage.hasOwnProperty(k)){
                    if(typeof storage[k] !== 'string'){
                        storage[k] = String(storage[k]);
                    }
                    if(storage[k].length > valueSizeLimit || keys.length > keyNumberLimit) {
                        delete storage[k];
                    } else {
                        keys.push(k);
                    }
                }
            }
            if(window.livePortiaPage) {
                try{
                    livePortiaPage.localStorageUpdated(local.storage, session.storage);
                }catch(e){}
            }
        };

        return {
            storage: storage,
            update: update
        };
    }

    var local = makeStorage(2000, 100);
    var session = makeStorage(2000, 100);

    window.__defineGetter__('localStorage', function(){
        local.update();
        return local.storage;
    });

    window.__defineGetter__('sessionStorage', function(){
        session.update();
        return session.storage;
    });
})();
