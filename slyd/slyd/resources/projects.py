from __future__ import absolute_import

from .utils import BaseApiResponse


class ProjectsManagerFileResponse(BaseApiResponse):
    def __init__(self, data, command, project_manager):
        super(ProjectsManagerFileResponse, self).__init__(data)
        self.command = command
        self.project_manager = project_manager

    def format_response(self, request, data):
        return self.project_manager._render_file(request, self.command, data)


def download(manager, spider_id=None, attributes=None):
    project_id = manager.project_name
    spider_ids = [spider_id] if spider_id is not None else '*'
    command = {
        'cmd': 'download',
        'args': [project_id, spider_ids]
    }

    file_content = manager.pm.download_project(project_id, spider_ids)
    return ProjectsManagerFileResponse(file_content, command, manager.pm)
