import Ember from 'ember';
import { isObject, isArray } from '../../../../utils/types';

function isConflict(obj) {
    return isObject(obj) && '__CONFLICT' in obj;
}

/**
 * Sort keys so that indexes in the same array are in descending order.
 * This is the correct order in that patches can be unambiguously applied
 * sortKeys([['a', '1'], ['a', '10'], ['a', '2']]) => [['a', '10'], ['a', '2'], ['a', '1']]
 */
function sortKeys(keys){
    return keys.sort(function(a,b){
        if(a.length === b.length) {
            for (var i = 0, len = a.length; i < len; i++) {
                if(a[i] !== b[i]) {
                    if(/^\d+$/.test(a[i] + b[i])) {
                        return parseInt(b[i]) - parseInt(a[i]);
                    } else {
                        return a[i] > b[i] ? -1 : 1;
                    }
                }
            }
        } else {
            return a.length > b.length ? -1 : 1;
        }
    });
}

/**
 * Apply a set of patches in the format {'object.path': new_value}
 */
function applyPatches(obj, values) {
    var keys = sortKeys(Object.keys(values).map(key => key.split('.')));
    for(var key of keys) {
        patch(obj, key, values[key.join('.')]);
    }
    return obj;
}

/**
 * Set object's specified path to value
 */
function patch(obj, path, value) {
    if(isArray(obj)) {
        var idx = parseInt(path[0]) + 1;
        for (var i = 0, len = obj.length; i < len; i++) {
            if(isConflict(obj[i])) {
                idx--;
                if(idx === 0) {
                    obj.splice(i, 1, ...value);
                    return;
                }
            }
        }
    } else if (isObject(obj)) {
        if(path.length === 1) {
            obj[path] = value;
        } else {
            patch(obj[path[0]], path.slice(1), value);
        }
        return;
    }
    throw new Error("Could not patch object");
}

export default Ember.Controller.extend({
    projectController: Ember.inject.controller('projects.project'),

    init: function(){
        this.set('pendingPaths', []);
        this.set('resolvedValues', {}); // This is saved in flat format {'a.b.c.0': value}
        this._super();
    },

    getResolvedTree: function(){
        var content = this.get('model.contents');
        // JSON parse + stringify to deep copy because neither
        // Ember.copy or $.extend({}, true) worked
        content = JSON.parse(JSON.stringify(content));
        applyPatches(content, this.get('resolvedValues'));
        return content;
    },

    haveConflicts: Ember.computed('pendingPaths.[]', function(){
        return this.get('pendingPaths').length > 0;
    }),

    actions: {
        updateConflict: function(path, resolved, value) {
            if(resolved) {
                this.get('pendingPaths').removeObject(path);
                this.get('resolvedValues')[path] = value;
            } else if (!this.get('pendingPaths').contains(path)) {
                this.get('pendingPaths').pushObject(path);
            }
        },

        saveFile: function(){
            var project = this.get('projectController.model.id');
            var fileName = this.get('model.file');
            var content = this.getResolvedTree();
            var url = '/projects/' + project + '/spec/' + fileName.replace(/\.json$/, '');
            $.post(url, JSON.stringify(content)).then(() => {
                this.transitionTo('projects.project.conflicts');
            });
        }
    }
});
