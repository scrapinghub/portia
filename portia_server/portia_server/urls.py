from django.conf.urls import url, include

from . import views
from portia_api import urls

urlpatterns = [
    url(r'^api/', include((urls, 'api'), namespace='api')),
    url(r'^server_capabilities$', views.capabilities),
]
