import config from 'portia-web/config/environment';
import Ember from 'ember';

export var fixtures = {};

export var lastRequest = {
    method: null,
    url: null,
    data: null,
    captured: [],

    clear: function(){
        this.url = null;
        this.method = null;
        this.data = null;
        this.captured = [];
    },
    add: function(url, method, data){
        this.url = url;
        this.method = method;
        this.data = data;
        this.captured.push({url, method, data});
    }
};

var oldAjax = Ember.$.ajax;
Ember.$.ajax = function(args){
    var url = args.url.replace(/^https?:\/\/[^\/]+/, '');
    var data = args.data && JSON.parse(args.data);
    lastRequest.add(url, args.type, data);

    return oldAjax(args);
};
