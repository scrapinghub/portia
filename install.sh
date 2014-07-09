#!/bin/bash
# based on http://stackoverflow.com/questions/23453054/how-to-install-portia-a-python-application-from-github-mac

if [ "$(ls -A 2> /dev/null)" != "" ]; then
	echo "Please, create an empty folder and run an external install.sh from inside it."
    exit -1
fi

echo "Installing portia . . ."

pip install virtualenv

# Create the virtual environment
virtualenv portia

# Activate the virtual environment you created (change the path to reflect the name you used here if not “portia”.)
source portia/bin/activate

# clone portia from github into your virtualenv...
cd portia
git clone https://github.com/scrapinghub/portia

# pip install twisted, Scrapy and the requirements.txt:
cd portia/slyd
pip install twisted
pip install Scrapy
pip install -r requirements.txt
