from django.http.response import Http404

from rest_framework.decorators import detail_route
from rest_framework.response import Response
from rest_framework.status import HTTP_200_OK, HTTP_400_BAD_REQUEST

from django.conf import settings
from scrapy.utils.misc import load_object

from .projects import BaseProjectModelRoute, ProjectDownloadMixin
from ..jsonapi.exceptions import JsonApiGeneralException
from ..utils.extract import Pages, FetchError
from ..utils.spiders import load_spider
from portia_orm.models import Spider
Deployer = load_object(settings.PROJECT_DEPLOYER)


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
        data = Deployer(self.project).schedule(spider_id)
        return Response(data, status=HTTP_200_OK)
