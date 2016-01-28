from __future__ import absolute_import
import six

from .models import (ProjectSchema, SchemaSchema, FieldSchema, ExtractorSchema,
                     SpiderSchema)
from .schemas import _read_schemas
from ..errors import BadRequest
from ..utils.projects import ctx, init_project


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
    project['schemas'] = schemas
    project['spiders'] = spiders
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
    return None


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
