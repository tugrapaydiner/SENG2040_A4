document.addEventListener('DOMContentLoaded', function ()
{
    const postReplyForm = document.getElementById('post-reply-form'); // find the form
    const postsContainer = document.getElementById('posts-container'); // find the container for posts
    const csrfToken = postReplyForm?.querySelector('input[name=csrfmiddlewaretoken]')?.value; // get CSRF token

    if (postReplyForm && postsContainer && csrfToken) // make sure all elements exist
    {
        postReplyForm.addEventListener('submit', function (event)
        {
            event.preventDefault(); // stop default page reload

            const formData = new FormData(postReplyForm);

            fetch(postReplyForm.action, // send AJAX request
                {
                method: 'POST',
                body: formData,
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
                .then(response => // handle response from server
                {
                    if (!response.ok) // check for server errors (like 400, 401, 500)
                    {
                        return response.json().then(errData => { throw errData; }).catch(() => { throw new Error(`HTTP error! status: ${response.status}`); }); // try to parse error details if server sent JSON, otherwise throw generic error
                    }
                    return response.json(); // parse successful JSON response
                })
                .then(data => // process successful data from server
                {
                    console.log('Success:', data); // log success data (for debugging)

                    postReplyForm.reset(); // clear form
                })
                .catch((error) => // handle fetch errors or errors thrown from .then()
                {
                    console.error('Error submitting post:', error);
                    alert('Failed to post reply. Please check your input or try again later.'); // Simple error alert for now
                });
        });
    }
});