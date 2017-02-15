import Ember from 'ember';
import SaveSpiderMixin from '../mixins/save-spider-mixin';

export default Ember.Component.extend(SaveSpiderMixin,{

    api: Ember.inject.service(),
    notificationManager: Ember.inject.service(),
    browser: Ember.inject.service(),

    spider: null,

    generateTable: function(cookiesList) {

        var cookies = JSON.parse(cookiesList);

        var table = document.createElement("TABLE");
        table.border = "1";

        for (var key in cookies) {
            if(cookies.hasOwnProperty(key)){
                var cookie = cookies[key];
                for (var prop in cookie) {
                    if(cookie.hasOwnProperty(prop)){
                        var row = table.insertRow(-1);
                        var cell1 = row.insertCell(-1);
                        cell1.innerHTML = prop;
                        var cell2 = row.insertCell(-1);
                        cell2.innerHTML = cookie[prop];
                    }
                }
            }
        }
        var dvTables = this.$('#dvTable');
        var i;
        for (i= 0; i < dvTables.length; i++) {
            dvTables[i].innerHTML = "";
            dvTables[i].appendChild(table.cloneNode(true));
        }
    },

    actions: {
        save() {
            this.saveSpider();
        },

        detectCookies(spider) {
            var currentUrl = this.get('browser.url');
            this.get('api').post('cookies', {
                model: spider,
                jsonData: {'current_url': currentUrl}
            }).then((cookies) => {
                this.get('notificationManager').showNotification(
                    'Detecting Cookies .. Please wait');
                this.generateTable(cookies);
            }, data => {
                let error = data.errors[0];
                if (error.status > 499) {
                    throw data;
                }
                this.get('notificationManager').showNotification(error.title, error.detail);
            });
        },


    },
});
