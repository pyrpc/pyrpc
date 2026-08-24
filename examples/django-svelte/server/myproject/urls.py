from django.contrib import admin
from django.urls import path
from pyrpc_django import mount_django

from . import views

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", views.index, name="index"),
]
mount_django(urlpatterns)
