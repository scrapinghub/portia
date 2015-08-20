
function paintCanvasMessage(canvas) {
    var ctx = canvas.getContext('2d');

    var pattern = document.createElement('canvas');
    pattern.width = 20;
    pattern.height = 20;
    var pctx = pattern.getContext('2d');
    pctx.fillStyle = "#ccc";
    pctx.fillRect(0,0,10,10);
    pctx.fillRect(10,10,10,10);
    pattern = ctx.createPattern(pattern, "repeat");

    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '16px sans-serif';
    ctx.fillStyle = 'black';
    ctx.fillText('Displaying the content of the canvas is not supported', 10, canvas.height / 2);
}

function addEmbedBlockedMessage(node) {
    if(!node || !node.parentNode || /EMBED|OBJECT/.test(node.parentNode.tagName)) {
        return;
    }
    var computedStyle = window.getComputedStyle(node);

    var width = node.hasAttribute("width")?node.getAttribute("width")+"px":computedStyle.width;
    var height = node.hasAttribute("height")?node.getAttribute("height")+"px":computedStyle.height;

    var errorMsg = $("<div/>").css({
        'background-color': '#269',
        'background-image': 'linear-gradient(rgba(255,255,255,.2) 1px, transparent 1px), ' +
                            'linear-gradient(90deg, rgba(255,255,255,.2) 1px, transparent 1px)',
        'background-size': '20px 20px, 20px 20px',
        'text-align': "center",
        'overflow': "hidden",
        'font-size': "18px",
        'display': "block",
        'font-family': 'sans-serif',
        'color': 'white',
        'text-shadow': '1px black',
        'width': width,
        'height': height,
        'lineHeight': height,
    }).text("Portia doesn't support browser plugins.");
    node.style.display = "none";
    node.parentNode.insertBefore(errorMsg[0], node);
}

export default function treeMirrorDelegate(){
    return {
        createElement: function(tagName) {
            var node = null;
            if(tagName === 'SCRIPT' || tagName === 'META' || tagName === 'BASE') {
                node = document.createElement('NOSCRIPT');
            } else if(tagName === 'FORM') {
                node = document.createElement(tagName);
                $(node).on('submit', ()=>false);
            } else if (tagName === 'IFRAME' || tagName === 'FRAME') {
                node = document.createElement(tagName);
                // TODO: copy file to new UI
                node.setAttribute('src', '/static/frames-not-supported.html');
            } else if (tagName === 'CANVAS') {
                node = document.createElement(tagName);
                paintCanvasMessage(node);
            } else if (tagName === 'OBJECT' || tagName === 'EMBED') {
                node = document.createElement(tagName);
                setTimeout(addEmbedBlockedMessage.bind(null, node), 100);
            }
            return node;
        },
        setAttribute: function(node, attrName, value){
            if(
                /^on/.test(attrName) ||  // Disallow JS attributes
                ((node.tagName === 'FRAME' || node.tagName === 'IFRAME') &&
                (attrName === 'src' || attrName === 'srcdoc')) || // Frames not supported
                ((node.tagName === 'OBJECT' || node.tagName === 'EMBED') &&
                (attrName === 'data' || attrName === 'src')) // Block embed / object
            ) {
                return true;
            }

            try{
                node.setAttribute(attrName, value);
            }catch(e){
                console.log(e, attrName, value);
            }

            if(node.tagName === 'CANVAS' && (attrName === 'width' || attrName === 'height')) {
                paintCanvasMessage(node);
            }

            return true;
        }
    };
}

