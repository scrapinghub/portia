import Ember from 'ember';

export function waitFor(fn, name, max) {
    max = max || 8000;
    name = name || 'unnamed';
    return new Ember.RSVP.Promise(function(accept, reject){
        var start = Date.now();
        function pool(){
            if(fn()){
                accept();
            } else {
                if(Date.now() - max > start) {
                    reject('timeout waiting for ' + name);
                } else {
                    setTimeout(pool, 30);
                }
            }
        }
        pool();
    });
}

export function timeout(howmuch){
  return new Ember.RSVP.Promise(function(resolve){
    setTimeout(resolve, howmuch || 200);
  });
}

export function waitForElement(e){
    return waitFor(() => $(e).length, 'Element ' + e);
}

