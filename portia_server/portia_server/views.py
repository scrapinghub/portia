from django.conf import settings
from portia_api.jsonapi import JSONResponse


def capabilities(request):
    capabilities = {
        'custom': settings.CUSTOM,
        'username': request.user.username,
        'capabilities': settings.CAPABILITIES,
    }
    return JSONResponse(capabilities)
