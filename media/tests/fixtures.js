var spiderNamesJson = ['spider1'];

var spider1Json = {
    "allowed_domains": [], 
    "exclude_patterns": [], 
    "follow_patterns": [], 
    "init_requests": [], 
    "links_to_follow": "none", 
    "respect_nofollow": true, 
    "start_urls": [
        "http://site1.com",
        "http://site2.com", 
    ], 
    "templates": [
        {
            "annotated_body": "<html><body><div data-scrapy-annotate=\"{&quot;id&quot;:&quot;ac93d6a6-63f5-f88d-03b3-7aff740f1cff&quot;,&quot;name&quot;:&quot;Annotation 1&quot;,&quot;annotations&quot;:{}}\"><h1>Some content</h1><h1>More content</h1></div><body></html>",
            "extractors": [], 
            "original_body": "<html><body><div><h1>Some content</h1><h1>More content</h1></div></body></html>",
            "page_id": "", 
            "page_type": "item", 
            "scrapes": "default", 
            "url": "http://site1.com"
        }, 
        {
            "annotated_body": "<html></html>",
            "extractors": [], 
            "original_body": "<html></html>",
            "page_id": "", 
            "page_type": "item", 
            "scrapes": "default", 
            "url": "http://site2.com"
        }
    ]
};

var itemsJson = {
    "default": {
        "fields": {
            "description": {
                "required": false, 
                "type": "safe html", 
                "vary": false
            }, 
            "images": {
                "required": true, 
                "type": "image", 
                "vary": true
            }, 
        }
    }
};