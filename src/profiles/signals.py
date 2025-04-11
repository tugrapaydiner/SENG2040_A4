from django.db.models.signals import post_save
from django.conf import settings
from django.dispatch import receiver
from .models import Profile

User = settings.AUTH_USER_MODEL

@receiver(post_save, sender=User) # connects this function to the "post_save" signal sent by the "User" model
def create_user_profile(sender, instance, created, **kwargs):
    if created: # check if new user record created
        Profile.objects.create(user=instance) # if yes, create a similar Profile object, link to new user
        print('DEBUG: Profile created!') # for debugging