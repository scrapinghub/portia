from collections import OrderedDict
import json

from django.utils.functional import cached_property
from six import itervalues, string_types

from .models import ProjectSchema
from .response import JsonApiResource, ProjectDownloadResponse
from .route import JsonApiRoute, ListModelMixin, RetrieveModelMixin
from ..errors import BadRequest, BaseError, NotFound
from portia_orm.models import Project

NOT_AVAILABLE_ERROR = 'This feature is not available for your project.'


class ProjectDownloadMixin(object):
    @classmethod
    def get_resources(cls):
        for resource in super(ProjectDownloadMixin, cls).get_resources():
            yield resource
        yield 'get', cls.download_path

    def get_handler(self):
        if self.route_path == self.download_path:
            return self.download
        return super(ProjectDownloadMixin, self).get_handler()

    def download(self):
        project_manager = self.project_manager
        project_id = self.args.get('project_id')
        spider_id = self.args.get('spider_id', None)
        spider_ids = [spider_id] if spider_id is not None else '*'
        fmt = self.query.get('format', ['spec'])[0]
        version = self.query.get('version', [None])[0]
        branch = self.query.get('branch', ['master'])[0]
        return ProjectDownloadResponse(
            project_id, spider_ids, fmt, version, branch, project_manager)


class ProjectDataMixin(object):
    @cached_property
    def projects(self):
        auth_info = self.request.auth_info
        if 'projects_data' in auth_info:
            projects = auth_info['projects_data']
        elif 'authorized_projects' in auth_info:
            projects = [{'id': id_, 'name': id_}
                        for id_ in auth_info['authorized_projects']]
        else:
            projects = self.project_manager.all_projects()

        project_list = []
        for project in projects:
            if isinstance(project, string_types):
                project = {
                    'id': project,
                    'name': project,
                }
            elif isinstance(project, dict):
                if not project.get('id'):
                    project['id'] = project['name']
            project_list.append(project)

        return OrderedDict([(project['id'], project) for project in projects])


class ProjectRoute(ProjectDownloadMixin, JsonApiRoute, ProjectDataMixin,
                   ListModelMixin, RetrieveModelMixin):
    list_path = 'projects'
    detail_path = 'projects/{project_id}'
    status_path = 'projects/{project_id}/status'
    publish_path = 'projects/{project_id}/publish'
    reset_path = 'projects/{project_id}/reset'
    download_path = 'projects/{project_id}/download'
    default_model = Project

    class FakeStorage(object):
        def exists(self, *args, **kwargs):
            return False

        def listdir(self, *args, **kwargs):
            return [], []

    @classmethod
    def get_resources(cls):
        for resource in super(ProjectRoute, cls).get_resources():
            yield resource
        yield 'get', cls.status_path
        yield 'put', cls.publish_path
        yield 'patch', cls.reset_path
        yield 'put', cls.publish_path
        yield 'patch', cls.reset_path

    def get_handler(self):
        if self.route_path == self.status_path:
            return self.status
        if self.route_path == self.publish_path:
            return self.publish
        if self.route_path == self.reset_path:
            return self.reset
        return super(ProjectRoute, self).get_handler()

    # def create(self):
    #     """Create a new project from the provided attributes"""
    #     manager = self.project_manager
    #     attributes = _check_project_attributes(manager, self.data)
    #     manager.create_project(attributes['name'])
    #     return self.serialize_instance({
    #         'id': attributes['name'],
    #         'name': attributes['name'],
    #     })

    # def update(self):
    #     """Update an exiting project with the provided attributes"""
    #     manager = self.project_spec
    #     project_id = self.args.get('project_id')
    #     attributes = _check_project_attributes(manager, self.data)
    #     if project_id != attributes['name']:
    #         manager.rename_project(project_id, attributes['name'])
    #     return self.serialize_instance({
    #         'id': project_id,
    #         'name': attributes['name'],
    #     })

    # def destroy(self):
    #     """Delete the request project"""
    #     manager = self.project_spec
    #     project_id = self.args.get('project_id')
    #     manager.remove_project(project_id)
    #     return self.get_empty()

    def status(self):
        response = self.retrieve()
        data = OrderedDict()
        data.update({
            'meta': {
                'changes': self.get_project_changes()
            }
        })
        data.update(response.data)
        return JsonApiResource(200, data)

    def publish(self):
        manager = self.project_spec
        if not hasattr(manager.pm, 'publish_project'):
            raise NotFound(NOT_AVAILABLE_ERROR)
        project_id = manager.project_name
        if not self.get_project_changes():
            raise BadRequest('The project is up to date')
        publish_status = json.loads(
            manager.pm.publish_project(project_id,
                                       self.data.get('force', False)))
        if publish_status['status'] == 'conflict':
            raise BaseError(409, 'A conflict has occurred in this project',
                            'You must resolve the conflict for the project to be'
                            ' successfully published')

        response = self.retrieve()
        data = OrderedDict()
        data.update({
            'meta': manager.pm._schedule_data(project_id=project_id)
        })
        data.update(response.data)
        return JsonApiResource(200, data)

    def reset(self):
        manager = self.project_spec
        if not hasattr(manager.pm, 'discard_changes'):
            raise NotFound(NOT_AVAILABLE_ERROR)
        project_id = manager.project_name
        if not self.get_project_changes():
            raise BadRequest('There are no changes to discard')
        manager.pm.discard_changes(project_id)
        return self.retrieve()

    def get_instance(self):
        return Project(
            self.storage, **self.projects[self.args.get('project_id')])

    def get_collection(self):
        storage = self.FakeStorage()
        return Project.collection(Project(storage, **project)
                                  for project in itervalues(self.projects))

    def get_detail_kwargs(self):
        return {
            'include_data': [
                'spiders',
                'schemas',
            ],
            'fields_map': {
                'spiders': [
                    'project',
                ],
                'schemas': [
                    'name',
                    'project',
                ],
            },
            'exclude_map': {
                'projects': [
                    'extractors',
                ],
            }
        }

    def get_list_kwargs(self):
        return {
            'fields_map': {
                'projects': [
                    'name',
                ],
            }
        }

    def get_project_changes(self):
        manager = self.project_spec
        if not hasattr(manager.pm, '_changed_files'):
            raise NotFound(NOT_AVAILABLE_ERROR)
        return [{'type': type_, 'path': path, 'old_path': old_path}
                for type_, path, old_path
                in manager.pm._changed_files(manager.project_name)]


def _check_project_attributes(manager, attributes):
    attributes = ProjectSchema().load(attributes).data
    if 'name' not in attributes:
        raise BadRequest('Bad Request',
                         'Can\'t create a project without a name')
    manager.validate_project_name(attributes['name'])
    return attributes
