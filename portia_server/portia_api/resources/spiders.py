from collections import OrderedDict
from django.http.response import Http404

import requests

from rest_framework.decorators import detail_route
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST

from django.conf import settings

from .projects import BaseProjectModelRoute, ProjectDownloadMixin
from ..jsonapi.exceptions import JsonApiGeneralException
from ..utils.extract import Pages, FetchError
from ..utils.spiders import load_spider
from portia_orm.models import Spider


class SpiderRoute(ProjectDownloadMixin, BaseProjectModelRoute):
    lookup_url_kwarg = 'spider_id'
    lookup_value_regex = '[^/]+'
    default_model = Spider

    def get_instance(self):
        return self.get_collection()[self.kwargs.get('spider_id')]

    def get_collection(self):
        return self.project.spiders

    @detail_route(methods=['post'])
    def extract(self, *args, **kwargs):
        try:
            instance = self.get_instance()
        except KeyError:
            raise JsonApiGeneralException(
                'No spider found with the name "%s"' % kwargs.get('spider_id'),
                404)
        try:
            spider = load_spider(instance)
        except (ValueError, KeyError, IndexError):
            raise JsonApiGeneralException(
                'Failed to load spider, "%s" correctly' % instance.id, 500)
        pages = self._build_pages(spider)
        try:
            data = pages.extract_items()
        except FetchError as e:
            raise JsonApiGeneralException(e.message, e.status)
        return Response(data, status=HTTP_200_OK)

    def _build_pages(self, spider):
        return Pages(self.data, spider)

    @detail_route(methods=['post'])
    def rename(self, *args, **kwargs):
        try:
            spider = self.get_instance()
            name = self.data['name']
            self.project.spiders
            possible_spider = Spider(self.storage, id=name)
            if possible_spider in self.project.spiders and name != spider.id:
                raise JsonApiGeneralException(
                    'Spider already exists in this project with the name, '
                    '"%s"' % name, HTTP_400_BAD_REQUEST)
            path = 'spiders/{}/{}'.format
            for sample in spider.samples:
                # Load sample and move html pages
                sample.url
                self.storage.move(path(spider.id, sample.id),
                                  path(name, sample.id))
            spider.id = name
            spider.save()
            self.storage.commit()
        except (TypeError, IndexError, KeyError):
            raise Http404
        data = self.get_serializer(spider).data
        return Response(data, status=HTTP_200_OK)

    @detail_route(methods=['post'])
    def schedule(self, *args, **kwargs):
        spider_id = self.data['data']['id']
        schedule_data = self._schedule_data(spider_id, self.data)
        request = requests.post(settings.SCHEDULE_URL, data=schedule_data)
        if request.status_code != 200:
            raise JsonApiGeneralException(
                request.status_code, request.content)
        response = self.retrieve()
        data = OrderedDict()
        data.update(response.data)
        data.setdefault('meta', {})['scheduled'] = True
        return Response(data, status=HTTP_200_OK)

    def _schedule_data(self, spider_id, args):
        data = {
            'project': self.project.id,
            'spider': spider_id
        }
        if self.storage.version_control:
            branch = self.query.get('branch', None)
            commit = self.query.get('commit_id', None)
            if not branch and self.storage.repo.has_branch(self.user.username):
                branch = self.user.username
            self.storage.checkout(commit, branch)
            commit_id = self.storage._commit.id
            data['version'] = commit_id
        return data
