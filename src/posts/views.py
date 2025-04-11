from django.shortcuts import render
from .models import Topic

def topic_list(request):
    topics = Topic.objects.all().order_by('-created_at') # sort by created_at  (newest first)

    context = {
        'topics': topics,
    }

    return render(request, 'posts/topic_list.html', context) # render HTML, passing request and context data

def topic_detail(request, pk):
    topic = get_object_or_404(Topic, pk=pk) # get Topic by ID or show 404 if not found
    posts = topic.posts.all().order_by('created_at')  # get all posts for this topic, sorted by oldest first

    context = {
        'topic': topic, # pass topic object
        'posts': posts, # and list of related post
    }

    return render(request, 'posts/topic_detail.html', context) # show the 'topic_detail' page with the given data