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
