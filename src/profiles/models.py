from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL # get active User model in settings

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE) # if User deleted, delete Profile
    bio = models.TextField(blank=True, null=True)
    created = models.DateTimeField(auto_now_add=True) # record creation time auto (once)
    updated = models.DateTimeField(auto_now=True) # record update time auto (every save)

    def __str__(self):
        return f"Profile of {self.user.username}" # show username profile belongs to