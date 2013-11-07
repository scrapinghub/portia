	How to try it:
	--------------

	Just run 'python rest.py' and then point your browser to:
	http://localhost:9001/main.html
	I am using chrome, try other browsers if you want but don't complain!

	What to expect:
	---------------
	
	It will load the now classical hoffman.html document. You will be able
	to add annotations, delete them and map the attributes from the selected
	document to item fields.
	
	Please don't look to much into selector.js, it's quite ugly at the moment
	(basically my js playfield...).
	
	Probably you are interested in looking at rest.py. It's a super simple
	twisted http server that behaves more or less like what's specified here:
	http://emberjs.com/guides/models/connecting-to-an-http-server/
	
	It has no real storage, everything is just kept in memory.