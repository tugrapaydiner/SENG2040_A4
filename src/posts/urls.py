from django.urls import path
from . import views  # import views

app_name = 'posts'

urlpatterns = [
    path('', views.topic_list, name='topic_list'),
    path('topic/<int:pk>/', views.topic_detail, name='topic_detail'),
    path('like/<int:pk>/', views.like_unlike_post, name='like_post'),
    path('delete/<int:pk>/', views.delete_post, name='delete_post'),
    path('edit/<int:pk>/', views.edit_post, name='edit_post'),
    path('upload/<int:topic_pk>/', views.handle_file_upload, name='upload_photo'),
]