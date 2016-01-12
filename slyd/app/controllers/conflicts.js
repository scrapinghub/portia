import Ember from 'ember';
import BaseController from './base-controller';
import ConflictMixin from '../mixins/conflict-mixin';
import utils from '../utils/utils';

export default BaseController.extend(ConflictMixin, {
    needs: ['application'],

    currentFileName: null,

    conflictedKeyPaths: {},

    conflictedFileNames: function() {
        return Object.keys(this.get('model')).sort();
    }.property('model'),

    currentFileContents: function() {
        return this.get('model')[this.get('currentFileName')];
    }.property('currentFileName'),

    getConflictedKeyPaths: function(content, parentPath) {
        if (utils.toType(content) === 'object') {
            if ('__CONFLICT' in content) {
                return [parentPath];
            } else {
                var conflicted = [];
                Object.keys(content).forEach(function(key) {
                    var path = parentPath ? parentPath + '.' + key : key;
                    conflicted = conflicted.concat(this.getConflictedKeyPaths(content[key], path));
                }.bind(this));
                return conflicted;
            }
        } else if (this._isArray(content)) {
            var result = [], idx = -1;
            for (var v of content) {
                if (utils.toType(v) === 'object' && '__CONFLICT' in v) {
                    idx += 1;
                    result.push(parentPath + '.' + idx);
                }
            }
            return result;
        }
        return [];
    },

    hasUnresolvedConflict: function() {
        var conflict = false;
        if (this.get('conflictedKeyPaths')) {
            conflict = Object.keys(this.get('conflictedKeyPaths')).any(function(key) {
                    var conflictObj = this.get('conflictedKeyPaths.'+key);
                    if (this._isArray(conflictObj)) {
                        return conflictObj.any(key => !key.resolved);
                    }
                    return !conflictObj.resolved;
            }, this);
        }
        return conflict;
    }.property('conflictedKeyPaths'),

    saveDisabled: function() {
        return this.get('hasUnresolvedConflict') || !this.get('currentFileName');
    }.property('hasUnresolvedConflict', 'currentFileName'),

    resolveContent: function(content, parentPath) {
        if (Array.isArray(content)) {
            if (this.get('conflictedKeyPaths')[parentPath]) {
                var result = [],
                    idx = 0;
                for (var item of content) {
                    if (this._isObject(item) && item['__CONFLICT']) {
                        var resolved = this.resolvedValue(item, [parentPath, idx].join('.'));
                        Array.prototype.push.apply(result, resolved);
                        idx += 1;
                    } else {
                        result.push(item);
                    }
                }
                content = result;
            }
        } else if (utils.toType(content) === 'object') {
            if ('__CONFLICT' in content) {
                if (parentPath in this.get('conflictedKeyPaths')) {
                    var option = this.get('conflictedKeyPaths.'+parentPath)['accepted'];
                    content = content['__CONFLICT'][option.keys().next().value];
                }
            } else {
                Object.keys(content).forEach(function(key) {
                    var path = parentPath ? parentPath + '.' + key : key;
                    content[key] = this.resolveContent(content[key], path);
                }.bind(this));
            }
        }
        return content;
    },

    displayConflictedFile: function(fileName) {
        this.set('currentFileName', fileName);
        var conflictedPaths = this.getConflictedKeyPaths(this.get('currentFileContents'));
        conflictedPaths.forEach(function(path) {
            var splitPath = path.split('.');
            if (splitPath.slice(-1)[0].match(/[0-9]+/)) {
                var parent = splitPath.slice(0, -1).join('.');
                if (!this.get('conflictedKeyPaths.'+parent)) {
                    this.set('conflictedKeyPaths.'+parent, []);
                }
            }
            this.set('conflictedKeyPaths.'+path, Ember.Object.create({
                'accepted': new Set(), 'rejected': new Set(), 'resolved': false}));
        }, this);
        this.notifyPropertyChange('conflictedKeyPaths');
    },

    actions: {

        displayConflictedFile: function(fileName) {
            this.get('documentView').setInteractionsBlocked(false);
            this.displayConflictedFile(fileName);
        },
        conflictOptionUpdated: function(path, accepted, rejected) {
            this._conflictOptionUpdated(path, accepted, rejected);
            this.notifyPropertyChange('conflictedKeyPaths');
        },

        saveFile: function(fileName) {
            this.get('slyd').saveFile(
                this.get('slyd.project'),
                fileName,
                this.resolveContent(this.get('model')[fileName])).then(
                    function() {
                        delete this.get('model')[fileName];
                        this.notifyPropertyChange('model');
                        this.set('conflictedKeyPaths', {});
                        this.set('currentFileName', null);
                        if (Ember.isEmpty(this.get('conflictedFileNames'))) {
                            this.get('slyd').publishProject(this.get('slyd.project'), true);
                            this.showSuccessNotification(this.messages.get('conflicts_solved'));
                            this.transitionToRoute('projects');
                        } else {
                            this.displayConflictedFile(this.get('conflictedFileNames')[0]);
                        }
                    }.bind(this)
                );
        },

        publish: function() {
            this.get('slyd').publishProject(this.get('slyd.project'), true);
        },
    },

    willEnter: function() {
        this.set('model', this.get('model') || {});
        this.get('document.view').config({
            mode: 'none',
            blankPage: true
        });
        if (!Ember.isEmpty(this.get('conflictedFileNames'))) {
            this.displayConflictedFile(this.get('conflictedFileNames')[0]);
        }
    },
});
