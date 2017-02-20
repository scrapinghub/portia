from collections import OrderedDict

from django.utils.functional import cached_property
from rest_framework.decorators import detail_route
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_201_CREATED
from six import iteritems

from portia_orm.models import Project
from storage import get_storage_class
from storage.backends import InvalidFilename
from .route import (JsonApiRoute, JsonApiModelRoute, CreateModelMixin,
                    ListModelMixin, RetrieveModelMixin)
from .response import FileResponse
from ..jsonapi.exceptions import (JsonApiFeatureNotAvailableError,
                                  JsonApiBadRequestError,
                                  JsonApiNotFoundError,
                                  JsonApiConflictError)
from ..utils.download import ProjectArchiver, CodeProjectArchiver
from ..utils.copy import ModelCopier, MissingModelException


class ProjectDownloadMixin(object):
    @detail_route(methods=['get'])
    def download(self, *args, **kwargs):
        fmt = self.query.get('format', 'spec')
        version = self.query.get('version', None)
        branch = self.query.get('branch', None)
        spider_id = self.kwargs.get('spider_id', None)
        spiders = [spider_id] if spider_id is not None else None
        try:
            self.project
        except InvalidFilename as e:
            raise JsonApiNotFoundError(str(e))
        if hasattr(self.storage, 'checkout') and (version or branch):
            try:
                self.storage.checkout(version, branch)
            except IOError:
                pass
            except ValueError as e:
                raise JsonApiNotFoundError(str(e))
        archiver = CodeProjectArchiver if fmt == u'code' else ProjectArchiver
        try:
            content = archiver(self.storage).archive(spiders)
        except IOError as e:
            raise JsonApiNotFoundError(str(e))
        return FileResponse('{}.zip'.format(self.project.name), content,
                            status=HTTP_200_OK)


class BaseProjectRoute(JsonApiRoute):
    @cached_property
    def projects(self):
        storage_class = get_storage_class()
        return storage_class.get_projects(self.request.user)

    @cached_property
    def project(self):
        project_id = self.kwargs.get('project_id')
        try:
            name = self.projects[project_id]
            return Project(self.storage, id=project_id, name=name)
        except KeyError:
            raise JsonApiNotFoundError()


class BaseProjectModelRoute(BaseProjectRoute, JsonApiModelRoute):
    pass


class ProjectRoute(ProjectDownloadMixin, BaseProjectRoute,
                   ListModelMixin, RetrieveModelMixin, CreateModelMixin):
    lookup_url_kwarg = 'project_id'
    default_model = Project

    class FakeStorage(object):
        def exists(self, *args, **kwargs):
            return False

        def listdir(self, *args, **kwargs):
            return [], []

    def create(self, request):
        """Create a new project from the provided attributes"""
        try:
            name = self.data['data']['attributes']['name']
        except KeyError:
            raise JsonApiBadRequestError('No `name` provided')
        self.kwargs['project_id'] = name

        projects = self.projects
        if not self.storage.is_valid_filename(name) or '.' in name:
            raise JsonApiBadRequestError(
                '"{}" is not a valid project name,\nProject names may only '
                'contain letters and numbers'.format(name))
        if name in projects:
            raise JsonApiBadRequestError(
                'A project with the name "{}" already exists'.format(name))

        # Bootstrap project
        storage = self.storage
        storage.commit()

        project = Project(storage, id=name, name=name)
        serializer = self.get_serializer(project, storage=storage)
        data = serializer.data
        headers = self.get_success_headers(data)
        return Response(data, status=HTTP_201_CREATED, headers=headers)

    # def update(self):
    #     """Update an exiting project with the provided attributes"""

    # def destroy(self):
    #     """Delete the requested project"""

    @detail_route(methods=['get'])
    def status(self, *args, **kwargs):
        response = self.retrieve()
        data = OrderedDict()
        data.update({
            'meta': {
                'changes': self.get_project_changes()
            }
        })
        data.update(response.data)
        return Response(data, status=HTTP_200_OK)

    @detail_route(methods=['put', 'patch', 'post'])
    def publish(self, *args, **kwargs):
        if not self.storage.version_control and hasattr(self.storage, 'repo'):
            raise JsonApiFeatureNotAvailableError()

        if not self.get_project_changes():
            raise JsonApiBadRequestError('You have no changes to publish')

        force = self.query.get('force', False)
        branch = self.storage.branch
        published = self.storage.repo.publish_branch(branch, force=force)
        if not published:
            raise JsonApiConflictError(
                'A conflict occurred when publishing your changes.'
                'You must resolve the conflict before the project can be '
                'published.')
        self.deploy()
        self.storage.repo.delete_branch(branch)
        response = self.retrieve()
        return Response(response.data, status=HTTP_200_OK)

    @detail_route(methods=['put', 'patch', 'post'])
    def reset(self, *args, **kwargs):
        if not self.storage.version_control and hasattr(self.storage, 'repo'):
            raise JsonApiFeatureNotAvailableError()
        branch = self.storage.branch
        master = self.storage.repo.refs['refs/heads/master']
        self.storage.repo.refs['refs/heads/%s' % branch] = master
        return self.retrieve()

    @detail_route(methods=['post'])
    def copy(self, *args, **kwargs):
        from_project_id = self.query.get('from') or self.data.get('from')
        if not from_project_id:
            raise JsonApiBadRequestError('`from` parameter must be provided.')
        try:
            self.projects[from_project_id]
        except KeyError:
            raise JsonApiNotFoundError(
                'No project exists with the id "{}"'.format(from_project_id))
        models = self.data.get('data', [])
        if not models:
            raise JsonApiBadRequestError('No models provided to copy.')

        try:
            copier = ModelCopier(self.project, self.storage, from_project_id)
            copier.copy(models)
        except MissingModelException as e:
            raise JsonApiBadRequestError(
                'Could not find the following ids "{}" in the project.'.format(
                    '", "'.join(e.args[0])))
        response = self.retrieve()
        return Response(response.data, status=HTTP_201_CREATED)

    def get_instance(self):
        return self.project

    def get_collection(self):
        storage = self.FakeStorage()
        return Project.collection(
            Project(storage, id=project_id, name=name)
            for project_id, name in iteritems(self.projects))

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
        storage = self.storage
        if not storage.version_control:
            raise JsonApiFeatureNotAvailableError()
        return [{'type': type_, 'path': path, 'old_path': old_path}
                for type_, path, old_path
                in storage.changed_files()]

    def deploy(self):
        pass
