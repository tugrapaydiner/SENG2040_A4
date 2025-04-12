redirect
from django.conf import settings
from django.contrib.auth.decorators import login_required
from .models import Profile
from .forms import ProfileForm

User = settings.AUTH_USER_MODEL

def profile_detail_view(request, username):
    pass

@login_required # only logged users can edit
def profile_edit_view(request):
    profile_obj = get_object_or_404(Profile, user=request.user) # get user's own profile
    user_obj = request.user

    if request.method == 'POST':
        form = ProfileForm(request.POST, instance=profile_obj) # populate form with POST data AND the current profile instance
        if form.is_valid():
            profile = form.save(commit=False) # save changes to Profile model 

            user_obj.first_name = form.cleaned_data.get('first_name')
            user_obj.last_name = form.cleaned_data.get('last_name')
            user_obj.save()

            profile.save()

            return redirect('profiles:profile_detail', username=request.user.username) # redirect to user's profile page
    else: # GET request
        form = ProfileForm(instance=profile_obj, initial={ # populate form with current data from profile and user instance
            'first_name': user_obj.first_name,
            'last_name': user_obj.last_name,
        })

    context = {
        'form': form,
    }
    return render(request, 'profiles/profile_edit.html', context)
