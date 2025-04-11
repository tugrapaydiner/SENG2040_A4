from django.shortcuts import render, get_object_or_404, redirect
from .models import Topic, Post
from django.contrib.auth.decorators import login_required
from .forms import PostForm
from django.http import JsonResponse

def topic_list(request):
    topics = Topic.objects.all().order_by('-created_at') # sort by created_at  (newest first)

    context = {
        'topics': topics,
    }

    return render(request, 'posts/topic_list.html', context) # render HTML, passing request and context data

def topic_detail(request, pk):
    topic = get_object_or_404(Topic, pk=pk) # get Topic by ID or show 404 if not found
    posts = topic.posts.all().order_by('created_at')  # get all posts for this topic, sorted by oldest first

    if request.method == 'POST': # check if the request method is POST ( submitted? )
        if not request.user.is_authenticated: # makesure user is logged in before posting
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'error': 'Authentication required.'}, status=401) # 401 Unauthorized
            else:
                return redirect('login') # redirects to login if not loged

        form = PostForm(request.POST) # populate with request data

        if form.is_valid(): # check if form is valid according to PostForm rules
            new_post = form.save(commit=False) # create Post but DON'T save to database fore now
            new_post.author = request.user # set author to logged in user
            new_post.topic = topic # set topic to the current topic being viewed
            new_post.save() # now save to database

            is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest' # check if request is AJAX using header
            if is_ajax: # if AJAX, return JSON response with new details
                return JsonResponse({
                    'message': 'success',
                    'post_id': new_post.id,
                    'content': new_post.content,
                    'author': new_post.author.username,
                    'created_at': new_post.created_at.strftime('%B %d, %Y, %I:%M %p').replace('AM', 'a.m.').replace('PM', 'p.m.'), # Example format
                })
            else:
                return redirect('topic_detail', pk=topic.pk) # go back to same topic page to avoid double posting
        else:
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest': # handle invalid form in AJAX by sending error as JSON
                return JsonResponse({'error': 'Invalid form data.', 'errors': form.errors}, status=400) # 400 Bad Request

    else: # if form has errors or it's a GET request, show the page with the form
        form = PostForm()

    context = {
        'topic': topic, # pass topic object
        'posts': posts, # and list of related post
        'form': form, # form too
    }

    return render(request, 'posts/topic_detail.html', context) # show the 'topic_detail' page with the given data