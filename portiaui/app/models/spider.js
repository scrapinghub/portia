import DS from 'ember-data';


const Spider = DS.Model.extend({
    name: DS.attr('string'),
    project: DS.belongsTo(),
    // json fixes error with storing ember NativeArray in indexed db
    startUrls: DS.attr('json', {
        defaultValue() {
            return [];
        }
    }),
    pageActions: DS.attr('json', {
        defaultValue() {
            return [{
                type: "click",
                selector: "body"
            }, {
                type: "click",
                selector: "#foffo",
            }, {
                type: "set",
                selector: ".bar",
                value: "asd"
            }];
        }
    }),
    samples: DS.hasMany({
        async: true
    })
});

export default Spider;
