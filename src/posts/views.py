from django.shortcuts import render, get_object_or_404, redirect
from .models import Topic, Post
from django.contrib.auth.decorators import login_required
from .forms import PostForm
from django.http import JsonResponse, HttpResponseForbidden

def topic_list(request):
    topics = Topic.objects.all().order_by('-created_at') # sort by created_at  (newest first)

    context = {
        'topics': topics,
    }

    return render(request, 'posts/topic_list.html', context) # render HTML, passing request and context data

def topic_detail(request, pk):
    topic = get_object_or_404(Topic, pk=pk) # get Topic by ID or show 404 if not found
    posts = topic.posts.all().order_by('created_at')  # get all posts for this topic, sorted by oldest first
    form = PostForm()

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
                return redirect('posts:topic_detail', pk=topic.pk) # go back to same topic page to avoid double posting
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

@login_required
def like_unlike_post(request, pk):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest' # check if request is AJAX and POST (we only handle AJAX POST for this)
    if request.method == 'POST' and is_ajax:
        post = get_object_or_404(Post, pk=pk) # get specific Post or return 404
        user = request.user # get current logged user

        if user in post.liked.all(): # check if  user already likes this post
            post.liked.remove(user) # user already liked it ( remove the like )
            liked = False # flag to show user does not like it anymore
        else:
            post.liked.add(user) # user didnt liked it yet (add the like)
            liked = True # flag it now liked

        return JsonResponse({
            'message': 'success',
            'post_id': post.pk,
            'liked': liked,
            'like_count': post.like_count,
        })
    else:
        return HttpResponseForbidden("Invalid request method or not AJAX.") # if not AJAX POST request, forbid access

@login_required
def delete_post(request, pk):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'  
    if request.method in ['POST', 'DELETE'] and is_ajax: # allow POST or DELETE methods for deletion via AJAX
        post = get_object_or_404(Post, pk=pk)
        if request.user == post.author: # check if logged user is the author
            post.delete() # delete post from the database
            return JsonResponse({'message': 'success', 'post_id': pk})
        else:
            return JsonResponse({'error': 'You do not have permission to delete this post.'}, status=403) # user is not the author, return forbidden error
    else:
        return HttpResponseForbidden("Invalid request method or not AJAX.") # invalid method or not AJAX

@login_required
def edit_post(request, pk):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if request.method == 'POST' and is_ajax:
        post = get_object_or_404(Post, pk=pk)
        if request.user != post.author: # check permission
            return JsonResponse({'error': 'You do not have permission to edit this post.'}, status=403) # forbidden

        new_content = request.POST.get('content', None) # get new content from POST data ( textarea name is 'content')

        if new_content is not None: # check if content was sent
            if post.content != new_content: # if content actually changed (optional, prevents saving if no change)
                post.content = new_content.strip() # update content (strip whitespace)
                post.save(update_fields=['content', 'updated_at']) # save only specified fields

            
            return JsonResponse({ # return success with updated content (even if unchanged, return current)
                'message': 'success',
                'post_id': post.pk,
                'content': post.content, # send back updated content
                'content_html': post.content.replace('\n', '<br>'), # prerender line breaks for JS
             })
        else: # content missing in the request
             return JsonResponse({'error': 'Content field missing.'}, status=400) # bad request
    else:
        return HttpResponseForbidden("Invalid request method or not AJAX.") # invalid method or not AJAX
    
@login_required
def handle_file_upload(request, topic_pk):
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'
    if request.method == 'POST' and is_ajax: # expecting AJAX POST request from Dropzone
        try:
            topic = get_object_or_404(Topic, pk=topic_pk) 
            content = request.POST.get('content', '') # get content from FormData (sent by Dropzone's 'sendingmultiple' event)
            uploaded_files = request.FILES.getlist('file') # get list of uploaded files (using paramName 'file')

            if not content and not uploaded_files: # added a validation
                 return JsonResponse({'error': 'No content or files provided.'}, status=400)
            if len(uploaded_files) > 5: # check against maxFiles limit
                return JsonResponse({'error': 'Too many files uploaded.'}, status=400)

            new_post = Post.objects.create( # create Post object first
                author=request.user,
                topic=topic,
                content=content.strip()
            )

            photo_urls = [] # keep track of created photo URLs if I need for later use
            for file in uploaded_files:
                photo = Photo.objects.create(post=new_post, image=file)
                photo_urls.append(photo.image.url)

            return JsonResponse({ # send success response for JS to handle new post details
                'message': 'success',
                'post_id': new_post.pk, # ID of the created post
                'content': new_post.content,
                'author': new_post.author.username,
                'created_at': new_post.created_at.strftime('%B %d, %Y, %I:%M %p').replace('AM', 'a.m.').replace('PM', 'p.m.'),
                'photo_urls': photo_urls, # list of URLs for uploaded photos (optional)
                'content_html': new_post.content.replace('\n', '<br>'), # prerender
                'like_count': 0, # new post starts with 0 likes
                'author_username': request.user.username
            })

        except Exception as e: # log exception for debugging (serverside)
            print(f"Error during file upload: {e}") # logging
            return JsonResponse({'error': 'An unexpected error occurred during upload.'}, status=500) # internal server error

    else:
        return HttpResponseForbidden("Invalid request method or not AJAX.")