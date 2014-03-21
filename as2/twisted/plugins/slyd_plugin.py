"""Registers 'twistd slyd' command."""
from twisted.application.service import ServiceMaker

finger = ServiceMaker(
    'slyd', 'slyd.tap', 'A server for creating scrapely spiders', 'slyd')
