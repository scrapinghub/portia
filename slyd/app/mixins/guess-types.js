import Ember from 'ember';

var TAG_TYPES = {
    text:    new Set(["b", "blockquote", "cite", "code", "dd", "del",
                      "dfn", "div", "em", "h1", "h2", "h3", "h4", "h5", "h6",
                      "i", "id", "ins", "kbd", "lang", "mark", "p", "rb", "s",
                      "samp", "small", "span", "strong", "sub", "sup", "td",
                      "th", "title", "u"]),
    date:    new Set(["time"]),
    media:   new Set(["audio", "embed", "img", "source", "video"]),
    url:     new Set(["a", "area"]),
    data:    new Set(["data"]),
    option:  new Set(["option"]),
    input:   new Set(["input"]),
    quote:   new Set(["q"]),
    meta:    new Set(["meta"]),
    map:     new Set(["map"]),
    article: new Set(["article"]),
    abbr:    new Set(["abbr"])
};

var TYPE_FIELD_ORDER = {
    text:    ["text content"],
    date:    ["datetime", "text content"],
    media:   ["src", "srcset", "media"],
    url:     ["href"],
    data:    ["value", "text content"],
    option:  ["label", "value", "text content"],
    input:   ["value", "src", "name", "type"],
    quote:   ["cite", "text content"],
    meta:    ["content"],
    map:     ["name"],
    article: ["text content"],
    abbr:    ["title", "text content"]
};

var FIELD_TYPE = {
    text:    "text",
    date:    "date",
    media:   "image",
    url:     "url",
    map:     "text",
    article: "safe html"
};

var VOCAB_FIELD_PROPERTY =  {
    image: new Set(["photo"]),
    price: new Set(["price"]),
    geopoint: new Set(["geo"]),
    url: new Set(["logo", "agent", "sound", "url", "attach", "license"]),
    date: new Set(["bday", "rev", "dtstart", "dtend", "exdate", "rdate",
                   "created", "last-modified"]),
};

var VOCAB_FIELD_CLASS = {
    number:   new Set(["p-rating", "p-best", "p-worst", "p-longitude",
                       "p-latitude", "p-yield"]),
    image:    new Set(["u-photo"]),
    geopoint: new Set(["u-geo", "p-geo"]),
    url:      new Set(["u-url", "u-url"]),
    date:     new Set(["dt-bday", "dt-reviewed", "dt-start", "dt-end",
                       "dt-rev", "dt-published", "dt-updated"])
};

export default Ember.Mixin.create({
    guessFieldName: function(element) {
        if (element.attributes.property) {
            return element.attributes.property.value;
        }
        if (element.attributes.itemprop) {
            return element.attributes.itemprop.value;
        }
        if (element.attributes.name) {
            return element.attributes.name.value;
        }
    },

    guessFieldType: function(extractedData, element, guess) {
        var type = this.guessFieldClassification(element);
        if (type !== null) {
            var classes = element.classList,
                attributes = element.attributes,
                property;
            if (attributes.property) {
                property = attributes.property.value;
            }
            if (attributes.itemprop) {
                property = attributes.itemprop.value;
            }
            if (guess || !FIELD_TYPE[type] || type === 'text') {
                var guessed = this.guessType(extractedData, property, classes);
                if (guessed) {
                    return guessed;
                }
            }
            return FIELD_TYPE[type];
        }
    },

    guessFieldExtraction: function(element, attributes) {
        var type = this.guessFieldClassification(element);
        if (type !== null) {
            var fieldOrders = TYPE_FIELD_ORDER[type];
            attributes = attributes || element.attributes;
            for (var f of fieldOrders) {
                if (f === 'text content') {
                    if (attributes.contains('text content')) {
                        return f;
                    } else {
                        return 'content';
                    }
                }
                if (attributes.contains(f)) {
                    return f;
                }
            }
        }
    },

    guessFieldClassification: function(element) {
        var tag = element.tagName.toLowerCase();
        for (var key in TAG_TYPES) {
            if (TAG_TYPES[key].has(tag)) {
                return key;
            }
        }
        return null;
    },

    guessType: function(data, property, classes) {
        var key;
        classes = Array.prototype.slice.call(classes, 0);
        if (property) {
            for (key in VOCAB_FIELD_PROPERTY) {
                if (VOCAB_FIELD_PROPERTY[key].has(property)) {
                    return key;
                }
            }
        }
        if (classes) {
            var prefixes = new Set(['p', 'u', 'dt']);
            classes = classes.filter(c => prefixes.has(c.split('-')[0]));
            if (classes.length > 0) {
                for (key in VOCAB_FIELD_CLASS) {
                    for (var i=0; i < classes.length; i++) {
                        property = classes[i];
                        if (VOCAB_FIELD_CLASS[key].has(property)) {
                            return key;
                        }
                    }
                }
            }
        }
        if (/^(?:(?:http)|(?:\/))/.test(data)) {
            return 'url';
        }
        data = data.trim();
        var geopoint = data.match(/[+-]?\d+(?:\.\d+)?[,;]\s?[+-]?\d+(?:\.\d+)?/);
        if (geopoint !== null) {
            return 'geopoint';
        }
        var prices = data.match(/\d+(?:(?:,\d{3})+)?(?:.\d+)?/);
        if (prices !==null && prices.length && (prices[0].length / data.length) > 0.05 ) {
            return 'price';
        }
        var numbers = data.match(/\d+(?:\.\d+)?/);
        if (numbers !== null && numbers.length && (numbers[0].length / data.length) > 0.05 ) {
            return 'number';
        }
        return 'text';
    }
});
