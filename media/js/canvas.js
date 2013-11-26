ASTool.Canvas = Em.Object.extend({

	appController: null,

	sprites: null,
	
	draw: function() {

		var documentView = appController.get('documentView');
		var sprites = documentView.get('sprites');

		if (hoveredSprite) {
			sprites = sprites.concat([hoveredSprite]);
		}

		_canvas = $('#infocanvas');
		canvas = _canvas.get(0);

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
});

ASTool.Sprite = Em.Object.extend({
	zPosition: 0,

	draw: function() {},
});


ASTool.RectSprite = ASTool.Sprite.extend({
	fillColor: 'blue',
	boderWidth: 1,
	strokeColor: 'white',
	dashed: false,
	dashPattern: [2, 2],
	hasShadow: false,
	shadowColor: 'black',
	shadowOffsetX: 0,
	shadowOffsetY: 0,
	shadowBlur: 10,
	text: null,
	textColor: 'black',
	rect: null,

	draw: function(context) {
		context.save();
		var rect = this.getBoundingBox();
		if (this.get('text')) {
			context.fillStyle = this.get('textColor');
			context.font = "bold 12px sans-serif";
			context.fillText(this.get('text'),
					 	 	 rect.left + 4,
				 		 	 rect.top - 1);
		}
		context.save();
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
		if (this.get('dashed')) {
			context.setLineDash(this.get('dashPattern'));
		}

	    context.lineWidth = this.get('boderWidth');
		context.strokeStyle = this.get('strokeColor');
		context.strokeRect(rect.left + 2,
			           rect.top + 2,
					   rect.width,
					   rect.height);
		context.restore();
	}
});


ASTool.AnnotationSprite = ASTool.RectSprite.extend({
	annotation: null,
	fillColor: 'rgba(88,120,220,0.3)',
	strokeColor: 'white',
	hasShadow: 'true',

	text: function() {
		return this.get('annotation.name');
	}.property('annotation'),

	getBoundingBox: function() {
		return $(this.get('annotation.element')).boundingBox();
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



