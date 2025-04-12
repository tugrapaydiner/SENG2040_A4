from django import forms
from .models import Profile

class ProfileForm(forms.ModelForm):
    bio = forms.CharField(widget=forms.Textarea(attrs={'rows': 4}), required=False)
    first_name = forms.CharField(max_length=30, required=False)
    last_name = forms.CharField(max_length=150, required=False)

    class Meta:
        model = Profile
        fields = ['bio']