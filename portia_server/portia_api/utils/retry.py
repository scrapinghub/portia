import random
import time

from retrying import Attempt, Retrying, RetryError
import six
from twisted.internet import defer, reactor
from twisted.python.failure import Failure


def deferred_retry(*dargs, **dkw):
    def wrap(f):
        @six.wraps(f)
        def wrapped_f(*args, **kw):
            return DeferredRetrying(*dargs, **dkw).call(f, *args, **kw)
        return wrapped_f
    return wrap


class DeferredRetrying(Retrying):
    def call(self, fn, *args, **kwargs):
        return self.defer_call(None, fn, args, kwargs)

    def defer_call(self, result, fn, args, kwargs,
                   attempt_number=1, start_time=None):
        if start_time is None:
            start_time = int(round(time.time() * 1000))

        fn_deferred = defer.maybeDeferred(fn, *args, **kwargs)
        fn_deferred.addBoth(self.handle_result, fn, args, kwargs,
                            attempt_number, start_time)
        return fn_deferred

    def handle_result(self, result, fn, args, kwargs,
                      attempt_number, start_time):
        """
        Copied from Retrying.call but handling twisted Failures and using
        reactor.callLater instead of sleep
        """
        if not isinstance(result, Failure):
            attempt = Attempt(result, attempt_number, False)
        else:
            tb = (result.type, result.value, result.tb)
            attempt = Attempt(tb, attempt_number, True)

        if not self.should_reject(attempt):
            return attempt.get(self._wrap_exception)

        delay_since_first_attempt_ms = \
            int(round(time.time() * 1000)) - start_time
        if self.stop(attempt_number, delay_since_first_attempt_ms):
            if not self._wrap_exception and attempt.has_exception:
                # get() on an attempt with an exception should cause it to be
                # raised, but raise just in case
                raise attempt.get()
            else:
                raise RetryError(attempt)
        else:
            sleep = self.wait(attempt_number, delay_since_first_attempt_ms)
            if self._wait_jitter_max:
                jitter = random.random() * self._wait_jitter_max
                sleep = sleep + max(0, jitter)
            timer = defer.Deferred()
            timer.addCallback(self.defer_call, fn, args, kwargs,
                              attempt_number + 1, start_time)
            reactor.callLater(sleep / 1000.0, timer.callback, None)
            return timer
