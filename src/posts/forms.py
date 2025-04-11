from django import forms
from .models import Post

class PostForm(forms.ModelForm):
    content = forms.CharField( # use bigger text box with placeholder and row settings
        label='', # hide default label
        widget=forms.Textarea(attrs={
            'rows': 3, # set initial height text area
            'placeholder': 'Add your reply here...'
        })
    )

    class Meta:
        model = Post # specify model form is based on
        fields = ['content'] # list fields from the model to include in the form