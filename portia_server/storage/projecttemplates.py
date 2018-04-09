from slybot import __version__ as slybot_version

_PROJECT_TEMPLATE = """\
{}\
"""


_SETTINGS_TEMPLATE = """\
# Automatically created by: portia
import os

SPIDER_MANAGER_CLASS = 'slybot.spidermanager.SlybotSpiderManager'
EXTENSIONS = {
    'slybot.closespider.SlybotCloseSpider': 1
}
ITEM_PIPELINES = {
    'slybot.dupefilter.DupeFilterPipeline': 1,
    'slybot.meta.DropMetaPipeline': 2
}
SPIDER_MIDDLEWARES = {
    # as close as possible to spider output
    'slybot.spiderlets.SpiderletsMiddleware': 999
}
DOWNLOADER_MIDDLEWARES = {
    'slybot.pageactions.PageActionsMiddleware': 700,
    'scrapy_splash.middleware.SplashCookiesMiddleware': 723,
    'slybot.splash.SlybotJsMiddleware': 725
}
PLUGINS = [
    'slybot.plugins.scrapely_annotations.Annotations',
    'slybot.plugins.selectors.Selectors'
]
SLYDUPEFILTER_ENABLED = True
SLYDROPMETA_ENABLED = False
DUPEFILTER_CLASS = 'scrapy_splash.SplashAwareDupeFilter'
FEED_EXPORTERS = {
    'csv': 'slybot.exporter.SlybotCSVItemExporter',
}
CSV_EXPORT_FIELDS = None

PROJECT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))

try:
    from local_slybot_settings import *
except ImportError:
    pass
try:
    from slybot_settings import *
except ImportError:
    pass
"""


_SETUP_PY_TEMPLATE = """\
# Automatically created by: portia

from setuptools import setup, find_packages

setup(
    name='%(name)s',
    version='1.0',
    packages=find_packages(),
    data_files = [
        ('', ['project.json', 'items.json', 'extractors.json']),
    ],
    entry_points={
        'scrapy': [
            'settings = spiders.settings'
        ]
    },
    zip_safe=True,
    include_package_data=True,
)

"""


_SCRAPY_TEMPLATE = """\
# Automatically created by: portia

[settings]
default = spiders.settings
"""

_MANIFEST_TEMPLATE = """\
include project.json
include extractors.json
include items.json
recursive-include spiders **.json
recursive-include spiders **.html
"""

_ITEMS_TEMPLATE = """\
{}
"""

_EXTRACTORS_TEMPLATE = """\
{}
"""

_REQUIREMENTS = """\
# Automatically created by: portia

slybot=={}
dateparser==0.7.0
loginform>=1.2.0
page_finder
scrapylib
scrapy-splash
scrapy-crawlera
scrapy-deltafetch
scrapy-dotpersistence
scrapy-pagestorage
""".format(slybot_version)


templates = {
    'PROJECT': _PROJECT_TEMPLATE,
    'SETTINGS': _SETTINGS_TEMPLATE,
    'SETUP': _SETUP_PY_TEMPLATE,
    'SCRAPY': _SCRAPY_TEMPLATE,
    'ITEMS': _ITEMS_TEMPLATE,
    'EXTRACTORS': _EXTRACTORS_TEMPLATE,
    'MANIFEST': _MANIFEST_TEMPLATE,
    'REQUIREMENTS': _REQUIREMENTS,
}
