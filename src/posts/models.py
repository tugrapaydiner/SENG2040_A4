from django.db import models
from django.conf import settings

User = settings.AUTH_USER_MODEL # get current user model

class Topic(models.Model):
    title = models.CharField(max_length=200) # text, max 200 chars
    author = models.ForeignKey(User, related_name='topics', on_delete=models.CASCADE) # link to user who created (delete topic if user deleted)
    created_at = models.DateTimeField(auto_now_add=True) # record creation time auto (once)
    updated_at = models.DateTimeField(auto_now=True) # record but for update (every save)
    
def __str__(self):
    return self.title # display topic's title