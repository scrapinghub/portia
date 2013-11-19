"""
Crawler Spec

Manages definitions of the crawler specifications

This will save, validate, potentially cache, etc. Right now it just
loads data from the filesystem.
"""
from os.path import join, exists
from slybot.utils import open_project_from_dir

class CrawlerSpecManager(object):

	def __init__(self, basedir):
		self.basedir = basedir

	def load_spec(self, project):
		"""load the spec for a given project"""
		projectdir = join(self.basedir, str(project))
		return open_project_from_dir(projectdir)
