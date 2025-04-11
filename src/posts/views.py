from django.shortcuts import render
from .models import Topic

def topic_list(request):
    topics = Topic.objects.all().order_by('-created_at') # sort by created_at  (newest first)

    context = {
        'topics': topics,
    }

    return render(request, 'posts/topic_list.html', context) # render HTML, passing request and context data