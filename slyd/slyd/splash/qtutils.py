
try:
    from PyQt5.QtCore import QObject
    from PyQt5.QtCore import pyqtSlot
    from PyQt5.QtWebKit import QWebElement
    from PyQt5.QtNetwork import QNetworkRequest
except ImportError:
    from PyQt4.QtCore import QObject
    from PyQt4.QtCore import pyqtSlot
    from PyQt4.QtWebKit import QWebElement
    from PyQt4.QtNetwork import QNetworkRequest

def to_py(obj):
    if hasattr(obj, 'toPyObject'):
        return obj.toPyObject()
    return obj

