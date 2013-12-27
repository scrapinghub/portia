ASTool.GraphRenderer = Em.Object.extend({
    system: null,
    canvas: null,

    init: function() {
        this.set('canvas', $('#crawlcanvas').get(0));
        this.get('system').screen({ step: 0.02 });
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
        ctx.clearRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = "#222222";
        ctx.strokeStyle = "#d3d3d3";
        ctx.lineWidth = 2;
        ctx.beginPath();

        ctx.strokeStyle = 'black';
        system.eachEdge(function(edge, pt1, pt2) {
            ctx.moveTo(pt1.x, pt1.y);
            ctx.lineTo(pt2.x, pt2.y);
        });
        ctx.stroke();

        system.eachNode(function(node, pt) {
            var label = node.data.label.substring(0, 20) || "";
            var w = ctx.measureText(label).width + 6;
            pt.x = Math.floor(pt.x);
            pt.y = Math.floor(pt.y);
          
            // clear any edges below the text label
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';


            ctx.beginPath();
            ctx.arc(pt.x, pt.y, w / 2, 0, 2 * Math.PI, false);
            ctx.fillStyle = 'green';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#003300';
            ctx.stroke();

            //ctx.fillRect(pt.x - w/2, pt.y - 12, w, 24);
          
            if (label) {
                ctx.font = "bold 10px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = "#EEEEEE";
                ctx.fillText(label, pt.x, pt.y+4);
            }
        });        
    },
});


ASTool.CrawlGraph = Em.Object.extend({

    system: null,

    init: function() {
        var system = arbor.ParticleSystem(2500, 500, 0.5, true, 55);
        this.set('system', system);
        system.renderer = ASTool.GraphRenderer.create({ system: system });
        ASTool.graph = this;
        this.addPage({fp:'XXXXX', url:''});
        this.addPage({fp:'YYYYY', url:''});
    },

    addPage: function(page, parentFp) {
        console.log(page.fp);
        //console.log(parentFp);
        this.system.addNode(page.fp, { label: page.url, mass: 10 });
        if (parentFp) {
            this.system.addEdge(parentFp, page.fp);
        }
    },
});

