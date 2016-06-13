from __future__ import absolute_import
import six
import json

from .models import (ProjectSchema, SchemaSchema, FieldSchema, ExtractorSchema,
                     SpiderSchema)
from .schemas import _read_schemas
from .utils import _read_extractors, BaseApiResponse
from ..errors import BadRequest, BaseError, NotFound
from ..utils.projects import ctx, init_project
NOT_AVAILABLE_ERROR = 'This feature is not available for your project.'


def list_projects(manager, attributes=None):
    """List all available project for the current user"""
    projects = []
    for project in manager.list_projects():
        if isinstance(project, six.string_types):
            project = {'id': project, 'name': project}
        elif isinstance(project, dict):
            if not project.get('id'):
                project['id'] = project['name']
        projects.append(project)
    return ProjectSchema(many=True).dump(projects).data


@init_project
def get_project(manager, attributes=None):
    """Get current project including schemas and extractors if required"""
    project_id = manager.project_name
    name = _get_project_name(manager.pm, project_id)
    project = {'name': name, 'id': project_id}
    schemas = [{'id': s} for s in _read_schemas(manager)]
    spiders = [{'id': s} for s in manager.list_spiders()]
    extractors = [{'id': s} for s in _read_extractors(manager)]
    project['schemas'] = schemas
    project['spiders'] = spiders
    project['extractors'] = extractors
    data = ProjectSchema(context=ctx(manager)).dump(project).data
    return data


def create_project(manager, attributes):
    """Create a new project from the provided attributes"""
    attributes = _check_project_attributes(manager, attributes)
    manager.create_project(attributes['name'])
    return ProjectSchema().dump({'name': attributes['name']}).data


def update_project(manager, project_id, attributes):
    """Update an exiting project with the provided attributes"""
    attributes = _check_project_attributes(manager, attributes)
    if project_id != attributes['name']:
        manager.rename_project(project_id, attributes['name'])
    return ProjectSchema().dump({'name': attributes['name']}).data


def delete_project(manager, project_id, attributes=None):
    """Delete the request project"""
    manager.remove_project(project_id)
    return ProjectSchema.empty_data()


def status(manager, attributes=None):
    if not hasattr(manager.pm, '_changed_files'):
        raise NotFound(NOT_AVAILABLE_ERROR)
    project_id = manager.project_name
    data = get_project(manager)
    data['meta'] = {
        'changes': [
            {'type': type_, 'path': path, 'old_path': old_path}
            for type_, path, old_path in manager.pm._changed_files(project_id)]
    }
    return data


def merge(manager, attributes=None):
    if not hasattr(manager.pm, 'publish_project'):
        raise NotFound(NOT_AVAILABLE_ERROR)
    project_id = manager.project_name
    if not status(manager):
        raise BadRequest('The project is up to date')
    publish_status = json.loads(
        manager.pm.publish_project(project_id, attributes.get('force', False)))
    if publish_status['status'] == 'conflict':
        raise BaseError(409, 'A conflict has occurred in this project',
                        'You must resolve the conflict for the project to be'
                        ' successfully published')
    data = get_project(manager)
    data['meta'] = manager.pm._schedule_data(project_id=project_id)
    return data


def reset(manager, attributes=None):
    if not hasattr(manager.pm, 'discard_changes'):
        raise NotFound(NOT_AVAILABLE_ERROR)
    project_id = manager.project_name
    if not status(manager):
        raise BadRequest('There are no changes to discard')
    manager.pm.discard_changes(project_id)
    return get_project(manager)


class ProjectsManagerFileResponse(BaseApiResponse):
    def __init__(self, data, command, project_manager):
        super(ProjectsManagerFileResponse, self).__init__(data)
        self.command = command
        self.project_manager = project_manager

    def format_response(self, request):
        return self.project_manager._render_file(request, self.command,
                                                 self.data)


def download(manager, spider_id=None, attributes=None):
    project_id = manager.project_name
    spider_ids = [spider_id] if spider_id is not None else '*'
    command = {
        'cmd': 'download',
        'args': [project_id, spider_ids]
    }
    fmt = attributes['arguments'].get('format', ['spec'])[0]
    file_content = manager.pm.download_project(project_id, spider_ids, fmt=fmt)
    return ProjectsManagerFileResponse(file_content, command, manager.pm)


def _check_project_attributes(manager, attributes):
    attributes = ProjectSchema().load(attributes).data
    if 'name' not in attributes:
        raise BadRequest('Bad Request',
                         'Can\'t create a project without a name')
    manager.validate_project_name(attributes['name'])
    return attributes


def _get_project_name(manager, project_id):
    projects = {}
    for project in manager.list_projects():
        if isinstance(project, six.string_types):
            projects[project] = project
        elif isinstance(project, dict):
            if 'id' in project:
                projects[project['id']] = project['name']
    return projects.get(project_id, project_id)
