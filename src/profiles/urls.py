from django.urls import path
from . import views

app_name = 'profiles'

urlpatterns = [
    path('<str:username>/', views.profile_detail_view, name='profile_detail'),
    path('edit/', views.profile_edit_view, name='profile_edit'),
]