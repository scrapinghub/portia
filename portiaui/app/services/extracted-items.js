import Ember from 'ember';

export default Ember.Service.extend({
    items: [
        {
            "name": "Pointy",
            "price": "$79",
            "description": 'Small, pointy, great at cleaning dishes. He is pointing at you and saying "Please buy me".',
            "details": [
                {
                    "property": "Size:",
                    "value": "Small"
                }, {
                    "property": "Colour:",
                    "value": "Green"
                }
            ]
        }, {
            "name": "Needy",
            "price": "$0",
            "description": "This owl won’t ever stop texting you. He’s free, please just take him.",
            "details": [
                {
                    "property": "Size:",
                    "value": "Medium"
                }, {
                    "property": "Colour:",
                    "value": "Blue"
                }
            ]
        }, {
            "name": "Smart",
            "price": "$499",
            "description": "This owl is not just wise, she is smart. Super smart.",
            "details": [
                {
                    "property": "Size:",
                    "value": "Medium"
                }, {
                    "property": "Colour:",
                    "value": "Yellow"
                }
            ]
        },
        {
            "name": "Tall",
            "price": "$599",
            "description": "Something happened when he was a kid.",
            "details": [
                {
                    "property": "Size:",
                    "value": "Large"
                }, {
                    "property": "Colour:",
                    "value": "Brown"
                }
            ]
        }, {
            "name": "Shy",
            "price": "$699",
            "description": "This is the shyest owl on the market. If you ever get to see its face you get your money back.",
            "details": [
                {
                    "property": "Size:",
                    "value": "Large"
                }, {
                    "property": "Colour:",
                    "value": "Brown"
                }
            ]
        }, {
            "name": "Snowy",
            "price": "$999",
            "description": "This owl is classified.",
            "details": [
                {
                    "property": "Size:",
                    "value": "Medium"
                }, {
                    "property": "Colour:",
                    "value": "Orange"
                }
            ]
        }
    ]
});
