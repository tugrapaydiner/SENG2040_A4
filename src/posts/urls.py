from django.urls import path
from . import views  # import views

urlpatterns = [
    path('', views.topic_list, name='topic_list'),
]