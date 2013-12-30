ASTool.GraphRenderer = Em.Object.extend({
    system: null,
    canvas: null,

    init: function() {
        this.set('canvas', $('#crawlcanvas').get(0));
        this.get('system').screen({ step: 0.02 });
        this.get('system').screenPadding(80);
        this.resize();
    },

    resize:function() {
        var canvas = this.get('canvas');
        canvas.width = $(canvas).outerWidth();
        canvas.height = $(canvas).outerHeight();
        this.get('system').screenSize(canvas.width, canvas.height);
        this.redraw();
    },

    redraw: function() {
        if (this.get('system') == null) {
            return;
        }
        
        var system = this.get('system');
        var canvas = this.get('canvas');
        var ctx = canvas.getContext('2d');
        ctx.save();
        ctx.clearRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        //ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.shadowColor = 'rgba(60, 60, 60, 0.75)';
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 6;

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#AAA';
        ctx.fillStyle = "#AAA"
        system.eachEdge(function(edge, pt1, pt2) {
            ctx.beginPath();
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
            ctx.stroke();

            ctx.save();
            var wt = 2;
            var arrowLength = 12 + wt;
            var arrowWidth = 4 + wt;
            ctx.translate(pt2.x, pt2.y);
            ctx.rotate(Math.atan2(pt2.y - pt1.y, pt2.x - pt1.x));

            ctx.beginPath();
            ctx.moveTo(-arrowLength - 20, arrowWidth);
            ctx.lineTo(-20, 0);
            ctx.lineTo(-arrowLength - 20, -arrowWidth);
            ctx.lineTo(-arrowLength * 0.8 - 20, -0);
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        });
        
        system.eachNode(function(node, pt) {
            ctx.shadowColor = 'rgba(60, 60, 60, 0.75)';
            ctx.shadowBlur = 6;
            var label = node.data.label.substring(0, 60) || "";
            if (label) {
                var w = 40;
                pt.x = Math.floor(pt.x);
                pt.y = Math.floor(pt.y);
                ctx.fillStyle = '#EEE';
                ctx.beginPath();
                ctx.arc(pt.x, pt.y, w / 2, 0, 2 * Math.PI, false);
                ctx.lineWidth = 4;
                ctx.strokeStyle = node['color'] || '#888';
                ctx.stroke();
                ctx.fill();
                //ctx.fillRect(pt.x - w/2, pt.y - 12, w, 24);
                if (label) {
                    ctx.shadowBlur = 2;
                    ctx.shadowColor = 'rgba(255, 255, 255, 1)';
                    ctx.font = "bold 12px Arial";
                    ctx.textAlign = "center";
                    ctx.fillStyle = "#111";
                    ctx.fillText(label, pt.x, pt.y+4);
                }
            }
        }); 
        ctx.restore();       
    },
});


ASTool.CrawlGraph = Em.Object.extend({

    system: null,

    init: function() {
        var system = arbor.ParticleSystem(10, 10, 0.1, true, 55);
        this.set('system', system);
        system.renderer = ASTool.GraphRenderer.create({ system: system });
        this.clear();
    },

    addPage: function(page, parentFp) {
        if (page.fp) {
            var node = this.system.addNode(page.fp, { label: page.url, mass: 1 });
            if (parentFp) {
                this.system.addEdge(parentFp, page.fp);
            } else {
                node['color'] = 'orange';
            }
        }
    },

    resize: function() {
        this.system.renderer.resize();
    },

    hidden: function(key, hidden) {
        if (arguments.length > 1) {
            if (hidden) {
                $('#crawlcanvas').css('display', 'none');
            } else {
                $('#crawlcanvas').css('display', 'block');
            }
        }
        return  $('#crawlcanvas').css('display') == 'none';
    }.property(),

    show: function() {
        $('#crawlcanvas').css('display', 'block');
    },

    clear: function() {
        this.system.prune(function() {return true});
        this.system.addNode('X', { label: '' });
        this.system.addNode('Y', { label: '' });
    },
});

