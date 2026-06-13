import django
from django.conf import settings

settings.configure(
    DEBUG=True,
    SECRET_KEY="test-secret-key-for-pyrpc",
    ROOT_URLCONF=__name__,
    ALLOWED_HOSTS=["*"],
    INSTALLED_APPS=["django.contrib.contenttypes", "django.contrib.auth"],
    DATABASES={"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}},
)
django.setup()
