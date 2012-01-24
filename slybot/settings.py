SPIDER_MANAGER_CLASS = 'slybot.spidermanager.SlybotSpiderManager'
EXTENSIONS = {'slybot.closespider.SlybotCloseSpider': 1}
PROJECT_DIR = 'slybot-project'

try:
    from local_asbot_settings import *
except ImportError:
    pass
