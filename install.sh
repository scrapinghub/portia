#!/bin/bash
# based on http://stackoverflow.com/questions/23453054/how-to-install-portia-a-python-application-from-github-mac

if [ "$(ls -A 2> /dev/null)" != "" ]; then
	echo "Please, create an empty folder, then just run install.sh from inside it."
	exit -1
fi

echo "Installing portia . . ."

wget -q https://raw.githubusercontent.com/cauerego/portia/master/run.sh -O run.sh && chmod 755 run.sh

pip install virtualenv

# Create the virtual environment
virtualenv portia

# Activate the virtual environment you created (change the path to reflect the name you used here if not “portia”.)
source portia/bin/activate

# clone portia from github into your virtualenv...
cd portia
git clone https://github.com/scrapinghub/portia

# install python requirements for portia
cd portia/slyd
pip install -r requirements.txt

echo "Finished portia installation! Run it with $ ./run.sh"
