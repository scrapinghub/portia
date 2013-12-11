How to try it:
--------------

The recommended way to install dependencies is to use virtualenv and
then do:

	pip install -r requirements.txt

Run the server using:

	twistd -n slyd

and point your browser to:
	http://localhost:9001/static/main.html

Only chrome is tested

What to expect:
---------------

It will load the now classical hoffman.html document. You will be able
to add annotations, delete them and map the attributes from the selected
document to item fields.

Most of the code is still an early prototype - expect it to be messy and
buggy for a while.


Slyd API Notes
--------------

This will be moved to separate docs - it's currently some notes for developers

All resources are either under /static/ or /api/. All API requests require a
project following the API, then the path to the endpoint.

spec

The project specification is available under /api/PROJECT/spec. The path format
mirrors the slybot format documented here:
http://slybot.readthedocs.org/en/latest/project.html

Currently, this is read only, but it will soon support PUT/POST.

The entire spec is returned for a GET request to the root:

	$ curl http://localhost:9001/api/78/spec
	{"project": {
    "version": "1308771278",
    "name": "demo"
    ..
	}

A list of available spiders can be retrieved:

  $ curl http://localhost:9001/api/78/spec/spiders
["accommodationforstudents.com", "food.com", "pinterest.com", "pin", "mhvillage"]

and specific resources can be requested:

	$ curl http://localhost:9001/api/78/spec/spiders/accommodationforstudents.com
	{
    	"templates":
    ...
	    "respect_nofollow": true
	}

The spec can be updating by POSTing:

  $ curl --data @newlinkedin.js http://localhost:9001/api/78/spec/spiders/linkedin

An HTTP 400 will be returned if the uploaded spec does not validate.


bot/fetch

Accepts json object with the following fields:
* request - same as scrapy requst object. At least needs a url
* spider - spider name within in the project
* page_id - unique ID for this page, must match the id used in templates (not yet implemented)
* parent_fp - fingerprint of parent request. This is used for managing referrer url, cookies, etc.

Returns a json object containing (so far):
* page - page content, not yet annotated but will be
* items - array of items extracted
* fp - request fingerprint

Coming soon in the response:
* template_id - id of template that matched
* trace - textual trace of the matching process - for debugging


To run put some data in data/projects/PROJECTID, these can be downloaded from dash or by:

$ bin/sh2sly data/projects -p 78 -k YOURAPIKEY

Then you can extract data:

$ curl -d '{"request": {"url": "http://www.pinterest.com/pin/339740365610932893/"}, "spider": "pinterest.com"}' http://localhost:9001/api/78/bot/fetch
{
  "fp": "0f2686acdc6a71eeddc49045b7cea0b6f81e6b61",
   "items": [
      {
         "url": "http://www.pinterest.com/pin/339740365610932893/",
         "_template": "527387aa4d6c7133c6551481",
         "image": [
            "http://media-cache-ak0.pinimg.com/736x/6c/c5/35/6cc5352046df0f8d8852cbdfb31542bb.jpg"
         ],
         "_type": "pin",
         "name": [
            "Career Driven"
         ]
      }
   ],
   "page": "<!DOCTYPE html>\n ...."
}

UI Testing
----------

A Karma test eviroment is now available. To run the ui tests:

    npm install 
    export PATH="./node_modules/.bin:$PATH"
    karma start

You can download npm from https://npmjs.org

Look at karma.conf.js to configure test options.

The tests are located in:
  media/tests