import Ember from 'ember';
import BaseController from './base-controller';

export default BaseController.extend({
    needs: ['application'],

    currentFileName: null,

    conflictedKeyPaths: {},

    conflictedFileNames: function() {
        return Object.keys(this.get('model')).sort();
    }.property('model'),

    currentFileContents: function() {
        return this.get('model')[this.get('currentFileName')];
    }.property('currentFileName'),

    toType: function(obj) {
        return ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();
    },

    getConflictedKeyPaths: function(content, parentPath) {
        if (this.toType(content) === 'object') {
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
        }
        return [];
    },

    hasUnresolvedConflict: function() {
        var conflict = false;
        if (this.get('conflictedKeyPaths')) {
            conflict = Object.keys(this.get('conflictedKeyPaths')).any(function(key) {
                    return !this.get('conflictedKeyPaths')[key];
            }, this);
        }
        return conflict;
    }.property('conflictedKeyPaths'),

    saveDisabled: function() {
        return this.get('hasUnresolvedConflict') || !this.get('currentFileName');
    }.property('hasUnresolvedConflict', 'currentFileName'),

    resolveContent: function(content, parentPath) {
        if (this.toType(content) === 'object') {
            if ('__CONFLICT' in content) {
                if (parentPath in this.get('conflictedKeyPaths')) {
                    var option = this.get('conflictedKeyPaths')[parentPath];
                    content = content['__CONFLICT'][option];
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
            this.get('conflictedKeyPaths')[path] = '';
        }, this);
        this.notifyPropertyChange('conflictedKeyPaths');
    },

    actions: {

        displayConflictedFile: function(fileName) {
            this.displayConflictedFile(fileName);
        },

        conflictOptionSelected: function(path, option) {
            this.get('conflictedKeyPaths')[path] = option;
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
        if (!Ember.isEmpty(this.get('conflictedFileNames'))) {
            this.displayConflictedFile(this.get('conflictedFileNames')[0]);
        }
    },
});
