import Ember from 'ember';
import { AnnotationSprite, IgnoreSprite } from './canvas';

export default Ember.Object.extend({
    _sprites: [],
    _ignores: [],
    _elements: [],

    init: function(options) {
        options = options || this.getWithDefault('options', {});
        var fillColor = options.fillColor || 'rgba(88,150,220,0.4)',
            strokeColor = options.strokeColor || 'rgba(88,150,220,0.4)',
            textColor = options.textColor || 'white';
        this.set('fillColor', fillColor);
        this.set('strokeColor', strokeColor);
        this.set('textColor', textColor);
    },

    sprites: function() {
        return this.get('_sprites').map(function(s) {
            return AnnotationSprite.create({
                annotation: s,
                fillColor: s.fillColor,
                strokeColor: s.strokeColor,
                textColor: s.textColor
            });
        }).concat(this.get('_ignores').map(function(s) {
            return IgnoreSprite.create({
                ignore: s,
                fillColor: s.fillColor,
                strokeColor: s.strokeColor,
                textColor: s.textColor
            });
        }));
    }.property('_sprites.@each', '_ignores.@each'),

    addSprite: function(element, text) {
        var notFound = true, updated = false;
        this.get('_sprites').forEach(function(sprite) {
            if (Ember.$(sprite.element).get(0) === element) {
<<<<<<< HEAD
                sprite.set('name', text);
=======
                sprite.name = text;
>>>>>>> Port App to Ember-Cli. Start Plugin System. Adds #133 and #136
                notFound = false;
                updated = true;
            }
        });
        if (notFound) {
            this.get('_sprites').pushObject(Ember.Object.create({
                name: text,
                element: element,
                highlight: false,
                fillColor: this.get('fillColor'),
                strokeColor: this.get('strokeColor'),
                textColor: this.get('textColor')
            }));
        }
        if (notFound || updated) {
            this.notifyPropertyChange('_sprites');
        }
    },

    addIgnore: function(element, ignoreBeneath) {
        var notFound = true, updated = false;
        this.get('_ignores').forEach(function(sprite) {
            if (Ember.$(sprite.element).get(0) === element) {
<<<<<<< HEAD
                sprite.set('ignoreBeneath', ignoreBeneath);
=======
                sprite.ignoreBeneath = ignoreBeneath;
>>>>>>> Port App to Ember-Cli. Start Plugin System. Adds #133 and #136
                notFound = false;
                updated = true;
            }
        });
        if (notFound) {
            this.get('_ignores').pushObject(Ember.Object.create({
                element: element,
                highlight: false,
                ignoreBeneath: ignoreBeneath,
                fillColor: this.get('fillColor'),
                strokeColor: this.get('strokeColor'),
                textColor: this.get('textColor')
            }));
        }
        if (notFound || updated) {
            this.notifyPropertyChange('_ignores');
        }
    },

    highlight: function(element) {
        this.get('_sprites').forEach(function(sprite) {
            if (Ember.$(sprite.element).get(0) === element) {
<<<<<<< HEAD
                sprite.set('highlighted', true);
=======
                sprite.highlighted = true;
>>>>>>> Port App to Ember-Cli. Start Plugin System. Adds #133 and #136
            }
        });
        this.notifyPropertyChange('_sprites');
    },

    removeHighlight: function(element) {
        this.get('_sprites').forEach(function(sprite) {
            if (Ember.$(sprite.element).get(0) === element) {
<<<<<<< HEAD
                sprite.set('highlighted', false);
=======
                sprite.highlighted = false;
>>>>>>> Port App to Ember-Cli. Start Plugin System. Adds #133 and #136
            }
        });
        this.notifyPropertyChange('_sprites');
    },

    removeSprite: function(element) {
        this.set('_sprites', this.get('_sprites').filter(function(sprite) {
            if (sprite.element !== element) {
                return true;
            }
        }));
    },

    removeIgnore: function(element) {
        this.set('_ignores', this.get('_ignores').filter(function(ignore) {
            if (ignore.element !== element) {
                return true;
            }
        }));
    },
});