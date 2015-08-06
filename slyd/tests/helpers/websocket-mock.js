
// API for tests to interface with the websocket

var ws = {
    lastMessage: null,
    url: null,
    sendMessage: function() {
        throw new Error('onmessage not set');
    },
    close: function() {
        throw new Error('onclose not set');
    },
    commands: {
        heartbeat: $.noop,
        resize: $.noop,
    }
};
export default ws;

var originalWs = window.WebSocket;

function WebSocket(url) {
    var that = this;
}

WebSocket.prototype = {
    close: function() {},
    send: function(data) {
        data = ws.lastMessage = JSON.parse(data);
        if(data._command && data._command in ws.commands){
            var resp = ws.commands[data._command](data);
            if(resp){
                resp.id = data._meta && data._meta.id;
                setTimeout(() => ws.sendMessage(resp), 1);
            }
        } else {
            console.log('No fixture for _command ' + data._command);
        }
    },
    url: '',
    readyState: originalWs.OPEN,
    OPEN: originalWs.OPEN,
    CLOSED: originalWs.CLOSED,
    CONNECTING: originalWs.CONNECTING,
    CLOSING: originalWs.CLOSING,
    set onmessage(fn) {
        ws.sendMessage = function(data) {
            fn({
                data: JSON.stringify(data)
            });
        };
    },
    get onmessage() {},
    set onopen(fn) {
        this.readyState = this.OPEN;
        fn();
    },
    get onopen() {},
    set onclose(fn) {
        ws.close = function(){
            this.readyState = this.CLOSED;
            fn();
        }.bind(this);
    },
    get onclose() {},
};
window.WebSocket = WebSocket;

