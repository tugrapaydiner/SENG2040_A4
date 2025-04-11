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

class Post(models.Model):
    content = models.TextField() # field for potentially long text content
    author = models.ForeignKey(User, related_name='posts', on_delete=models.CASCADE) # link to user who wrote post (delete post if user deleted)
    topic = models.ForeignKey(Topic, related_name='posts', on_delete=models.CASCADE) # link to topic post belongs to (delete post if topic deleted)
    created_at = models.DateTimeField(auto_now_add=True) # record creation time auto (once)
    updated_at = models.DateTimeField(auto_now=True) # record update time auto (every save)
    liked = models.ManyToManyField(User, related_name='liked_posts', default=None, blank=True) # likes

    def __str__(self):
        return self.content[:50] + "..." if len(self.content) > 50 else self.content # show first 50 characters (for display)

    # I will add get_photos and like_count methods later

    class Meta:   
        ordering = ['created_at'] # default ordering when fetched from DB (oldest first)