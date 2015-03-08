How to try it:
--------------

The recommended way to install dependencies is to use virtualenv and
then do:

	pip install -r requirements.txt

Run the server using:

	twistd -n slyd

and point your browser to:
	http://localhost:9001/static/index.html

Chrome and Firefox are supported, but it works better with chrome.

Slyd API Notes
--------------

This will be moved to separate docs - it's currently some notes for developers

All resources are either under /dist/ or /projects/.


project listing/creation/deletion/renaming

To get list all existing projects, just GET http://localhost:9001/projects:

	$ curl http://localhost:9001/projects -> ["project1", "project2"]

New projects can be created by posting to /projects, for example:

	$ curl -d '{"cmd": "create", "args": ["project_X"]}' http://localhost:9001/projects

To delete a project:

	$ curl -d '{"cmd": "rm", "args": ["project_X"]}' http://localhost:9001/projects

To rename a project:

	$ curl -d '{"cmd": "mv", "args": ["oldname", "newname"]}' http://localhost:9001/projects

Please note that projects will not be overwritten when renaming or creating new ones (if a project
with the given name already exists an error from the 400 family will be returned).

spec

The project specification is available under /projects/PROJECT_ID/spec. The path format
mirrors the slybot format documented here:
http://slybot.readthedocs.org/en/latest/project.html

Currently, this is read only, but it will soon support PUT/POST.

The entire spec is returned for a GET request to the root:

	$ curl http://localhost:9001/projects/78/spec
	{"project": {
    "version": "1308771278",
    "name": "demo"
    ..
	}

A list of available spiders can be retrieved:

  $ curl http://localhost:9001/projects/78/spec/spiders
["accommodationforstudents.com", "food.com", "pinterest.com", "pin", "mhvillage"]

and specific resources can be requested:

	$ curl http://localhost:9001/projects/78/spec/spiders/accommodationforstudents.com
	{
    	"templates":
    ...
	    "respect_nofollow": true
	}

The spec can be updating by POSTing:

  $ curl --data @newlinkedin.js http://localhost:9001/projects/78/spec/spiders/linkedin

An HTTP 400 will be returned if the uploaded spec does not validate.

Basic commands are available for manipulating spider files. For example:

  $ curl -d '{"cmd": "rm", "args": ["spidername"]}' http://localhost:9001/projects/78/spec/spiders

Available commands are:
* mv - move spider from first arg to second. If the second exists it is overwritten.
* rm - delete spider


bot/fetch

Accepts json object with the following fields:
* request - same as scrapy requst object. At least needs a url
* spider - spider name within in the project
* page_id - unique ID for this page, must match the id used in templates (not yet implemented)
* parent_fp - fingerprint of parent request. This is used for managing referrer url, cookies, etc.

Returns a json object containing (so far):
* page - page content, not yet annotated but will be
* response - object containing the response data: http code and headers
* items - array of items extracted
* fp - request fingerprint
* error - error message, present if there was an error
* links - array of links followed

Coming soon in the response:
* template_id - id of template that matched
* trace - textual trace of the matching process - for debugging


If you want to work on an existing project, put it in data/projects/PROJECTID, these can be downloaded from dash or by:

$ bin/sh2sly data/projects -p 78 -k YOURAPIKEY

Then you can extract data:

$ curl -d '{"request": {"url": "http://www.pinterest.com/pin/339740365610932893/"}, "spider": "pinterest.com"}' http://localhost:9001/projects/78/bot/fetch
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

Testing
-------

slyd can be tested using twisted:

    trial tests
