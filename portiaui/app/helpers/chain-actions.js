import Ember from 'ember';

export function chainActions(params/*, hash*/) {
    return function() {
        for (let action of params) {
            if (action.call) {
                action();
            }
        }
    };
}

export default Ember.Helper.helper(chainActions);
