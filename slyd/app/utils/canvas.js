import Ember from 'ember';

/**
    Draws ASTool.Sprite instances on a canvas specified by the
    canvasId property.
*/
export var Canvas = Ember.Object.extend({

    canvasId: null,

    canvas: null,

    context: null,

    init: function() {
        this.set('canvas', Ember.$('#' + this.get('canvasId')).get(0));
        this.set('context', this.get('canvas').getContext("2d"));
    },

    /**
        Clears the canvas.
    */
    clear: function() {
        var canvas = this.get('canvas');
        var context = this.get('context');
        context.clearRect(0, 0, canvas.width, canvas.height);
    },

    /**
        Draws the given sprites translating the context by (xOffset, yOffset)
        to compensate for the iframe current scroll position.
    */
    draw: function(sprites, xOffset, yOffset) {
        var canvas = this.get('canvas');
        var context = this.get('context');

        // Match intrinsic and extrinsic dimensions.
        canvas.width = Ember.$(canvas).outerWidth();
        canvas.height = Ember.$(canvas).outerHeight();

        context.translate(-xOffset, -yOffset);
        context.clearRect(0, 0, canvas.width, canvas.height);
        var sortedSprites = sprites.sort(function(a, b) {
            return a.get('zPosition') - b.get('zPosition');
        });
        sortedSprites.forEach(function(sprite) {
            sprite.draw(context);
        });
    },

    _interactionsBlocked: false,

    /**
        By default the canvas is configured to let all events pass through.
        Set this attribute to true to block interactions with the underlaying
        layers.
    */
    interactionsBlocked: function(key, interactionsBlocked) {
        if (arguments.length > 1) {
            this.set('_interactionsBlocked', interactionsBlocked);
            var canvas = Ember.$('#' + this.get('canvasId'));
            if (interactionsBlocked) {
                canvas.css('pointer-events', 'auto');
                canvas.css('background-color', 'rgba(0,0,30,0.2)');
                canvas.css('background', '-webkit-radial-gradient(circle, rgba(0,0,0,0.0), rgba(0,0,0,0.6)');
                canvas.css('background', '-moz-radial-gradient(circle, rgba(0,0,0,0.0), rgba(0,0,0,0.6)');
            } else {
                canvas.css('pointer-events', 'none');
                canvas.css('background-color', 'rgba(0,0,0,0)');
                canvas.css('background', 'rgba(0,0,0,0)');
            }
        } else {
            return this.get('_interactionsBlocked');
        }
    }.property('_interactionsBlocked'),

});

/**
    Base class for all the sprites rendered by ASTool.Canvas.
    Subclasses must implement the draw method.
*/
export var Sprite = Ember.Object.extend({

    /**
        Sprites with lower zPosition are drawn below sprites with
        higher zPosition.
    */
    zPosition: 0,

    draw: function() {
        throw('You must implement this method.');
    },
});


export var RECT_ZERO = { left: 0, top: 0, width: 0, height: 0};


/**
    Draws a rectangular sprite with a border, an optional shadow and an
    optional caption.
*/
export var RectSprite = Sprite.extend({
    fillColor: 'blue',
    boderWidth: 1,
    strokeColor: 'white',
    hasShadow: false,
    shadowColor: 'black',
    shadowOffsetX: 0,
    shadowOffsetY: 0,
    shadowBlur: 10,
    text: null,
    textColor: 'black',
    rect: null,
    blend: null,
    highlighted: null,
    textBackgroundColor: 'orange',

    draw: function(context) {
        this.drawRect(context, this.getBoundingBox());
    },

    drawRect: function(context, rect) {
        context.save();
        if (this.get('blend')) {
            context.globalCompositeOperation = this.get('blend');
        }
        if (this.get('hasShadow')) {
            context.shadowColor   = this.get('shadowColor');
            context.shadowOffsetX = this.get('shadowOffsetX');
            context.shadowOffsetY = this.get('shadowOffsetY');
            context.shadowBlur    = this.get('shadowBlur');
        }

        context.fillStyle = this.get('fillColor');
        context.fillRect(rect.left,
                         rect.top,
                         rect.width,
                         rect.height);
        context.restore();

        context.lineWidth = this.get('boderWidth');
        context.strokeStyle = this.get('strokeColor');
        if (this.get('highlighted')) {
            context.shadowColor = 'orange';
            context.shadowOffsetX = 0;
            context.shadowOffsetY = 0;
            context.shadowBlur = 5;
            context.lineWidth = 2;
            context.strokeStyle = 'orange';
        }
        context.strokeRect(rect.left,
                           rect.top,
                           rect.width,
                           rect.height);
        context.shadowColor = 'transparent';

        if (this.get('text')) {
            context.font = "12px sans-serif";
            var textWidth = context.measureText(this.get('text')).width;
            context.fillStyle = this.get('textBackgroundColor');
            if (!this.get('highlighted')) {
                context.globalAlpha = 0.5;
            }
            context.fillRect(rect.left, rect.top - 18, textWidth + 11, 18);
            context.fillRect(rect.left, rect.top - 1, rect.width, 2);
            context.fillStyle = this.get('textColor');
            context.globalAlpha = 1.0;
            context.fillText(this.get('text'),
                             rect.left + 6,
                             rect.top - 4);

        }
        context.restore();
    }
});


export var AnnotationSprite = RectSprite.extend({
    annotation: null,
    fillColor: 'rgba(88,150,220,0.4)',
    strokeColor: 'rgba(88,150,220,0.4)',
    hasShadow: false,
    textColor: 'white',
    _zPosition: 0,

    text: function() {
        return this.get('annotation.name');
    }.property('annotation.name'),

    highlighted: function() {
        return this.get('annotation.highlighted');
    }.property('annotation.highlighted'),

    getBoundingBox: function() {
        if (this.get('annotation.element')) {
            return Ember.$(this.get('annotation.element')).boundingBox();
        } else {
            return RECT_ZERO;
        }
    },

    zPosition: function(key, zPos) {
        if (arguments.length > 1) {
            this.set('_zPosition', zPos);
        }
        if (this.get('annotation.highlighted')) {
            return 1000;
        } else {
            return this.get('_zPosition');
        }
    }.property('annotation.highlighted'),
});


export var IgnoreSprite = RectSprite.extend({
    ignore: null,
    fillColor: 'black',
    strokeColor: 'rgba(255, 0, 0, 0.4)',
    textColor: 'rgba(255,150,150,1)',
    blend: 'destination-out',

    ignoreBeneath: function() {
        return this.get('ignore.ignoreBeneath');
    }.property('ignore.ignoreBeneath'),

    text: function() {
        return this.get('ignore.name');
    }.property('ignore.name'),

    highlighted: function() {
        return this.get('ignore.highlighted');
    }.property('ignore.highlighted'),

    draw: function(context) {
        var element = Ember.$(this.get('ignore.element'));
        if (this.get('ignoreBeneath')) {
            var elementsBeneath = element.nextAll();
            elementsBeneath.each(function(i, element) {
                this.drawRect(context, Ember.$(element).boundingBox());
            }.bind(this));
        }
        this.drawRect(context, element.boundingBox());
    },
});


export var ElementSprite = RectSprite.extend({
    element: null,
    fillColor: 'rgba(103,175,255,0.4)',
    strokeColor: 'white',
    hasShadow: false,
    boderWidth: 2,
    zPosition: 10,

    getBoundingBox: function() {
        return Ember.$(this.get('element')).boundingBox();
    },
});