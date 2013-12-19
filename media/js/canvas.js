ASTool.Canvas = Em.Object.extend({

	canvasId: null,

	datasource: null,
	
	draw: function() {
		var sprites = this.datasource.get('sprites');
		var hoveredSprite = this.datasource.get('hoveredSprite');
		var iframe = this.datasource.getIframe();

		if (hoveredSprite) {
			sprites = sprites.concat([hoveredSprite]);
		}

		_canvas = $('#' + this.get('canvasId'));

		if (!_canvas.length) {
			return;
		}
		
		canvas = _canvas.get(0);

		// Match intrinsic and extrinsic dimensions.
		canvas.width = _canvas.outerWidth();
		canvas.height = _canvas.outerHeight();

		var context = canvas.getContext("2d");
		var y_offset = iframe.scrollTop();
		var x_offset = iframe.scrollLeft();
		context.translate(-x_offset, -y_offset);

		context.clearRect(0, 0, canvas.width, canvas.height);
		var sortedSprites = sprites.sort(function(a, b) {
	    	return a.get('zPosition') - b.get('zPosition');
		}); 
		sortedSprites.forEach(function(sprite){
			sprite.draw(context);	
		});
	},

	_interactionsBlocked: false,
		
	interactionsBlocked: function(key, interactionsBlocked) {
		if (arguments.length > 1) {
			this.set('_interactionsBlocked', interactionsBlocked);
			var canvas = $('#' + this.get('canvasId'));
			if (interactionsBlocked) {
				canvas.css('pointer-events', 'auto');
				canvas.css('background-color', 'rgba(0,0,30,0.2)');
			} else {
				canvas.css('pointer-events', 'none');
				canvas.css('background-color', 'rgba(0,0,0,0)');
			}
		} else {
			return this.get('_interactionsBlocked');
		}
	}.property(),
});


ASTool.Sprite = Em.Object.extend({
	zPosition: 0,

	draw: function() {},
});


ASTool.RectSprite = ASTool.Sprite.extend({
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
		context.fillRect(rect.left + 2,
			         	 rect.top + 2,
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
		context.strokeRect(rect.left + 2,
			           rect.top + 2,
					   rect.width,
					   rect.height);

		if (this.get('text')) {
			context.font = "12px sans-serif";
			context.shadowColor   = 'rgba(0,0,0,0.5)';
		    context.shadowBlur    = 4;
			context.lineWidth = 2;
			context.strokeStyle = '#333';
			context.strokeText(this.get('text'),
					 	 	  rect.left + 6,
				 		 	  rect.top + 14);
			context.fillStyle = this.get('textColor');
			context.fillText(this.get('text'),
					 	 	 rect.left + 6,
				 		 	 rect.top + 14);
		}
		context.restore();
	}
});


ASTool.AnnotationSprite = ASTool.RectSprite.extend({
	annotation: null,
	fillColor: 'rgba(88,120,220,0.4)',
	strokeColor: 'white',
	hasShadow: 'true',
	textColor: 'white',

	text: function() {
		return this.get('annotation.name');
	}.property('annotation'),

	highlighted: function() {
		return this.get('annotation.highlighted');
	}.property('annotation'),

	getBoundingBox: function() {
		return $(this.get('annotation.element')).boundingBox();
	},
});


ASTool.IgnoreSprite = ASTool.RectSprite.extend({
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
		var element = $(this.get('ignore.element'));
		if (this.get('ignoreBeneath')) {
			var elementsBeneath = element.nextAll();
			elementsBeneath.each(function(i, element) {
				this.drawRect(context, $(element).boundingBox());
			}.bind(this));
		}
		this.drawRect(context, element.boundingBox());
	},
});


ASTool.ElementSprite = ASTool.RectSprite.extend({
	element: null,
	fillColor: 'rgba(88,120,220,0.3)',
	strokeColor: 'orange',
	hasShadow: 'true',

	getBoundingBox: function() {
		return $(this.get('element')).boundingBox();
	},
});



