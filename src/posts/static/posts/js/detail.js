document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM fully loaded.");
    const postReplyForm = document.getElementById('post-reply-form'); // find the form
    const postsContainer = document.getElementById('posts-container'); // find the container for posts
    const submitButton = document.getElementById('post-reply-submit-button'); // find submit button by ID
    console.log("Form found:", postReplyForm);
    console.log("Posts container found:", postsContainer);
    console.log("Submit button found:", submitButton);

    const csrfInput = postReplyForm?.querySelector('input[name=csrfmiddlewaretoken]'); // find csrf input element
    const csrfToken = csrfInput?.value; // get csrf token value
    console.log("CSRF input found:", csrfInput);
    console.log("CSRF token found:", csrfToken);

    if (postReplyForm && postsContainer && csrfToken && submitButton) // make sure all elements exist
    {
        console.log("Adding CLICK listener to button...");
        submitButton.addEventListener('click', function (event) // Listen for button click
        {
            event.preventDefault(); // stop default form submission behavior
            console.log('Submit BUTTON CLICK intercepted.'); // log click interception

            const formData = new FormData(postReplyForm); // get form data
            console.log('FormData content:', formData.get('content')); // log content being sent
            console.log('Initiating fetch request...'); // log fetch start

            fetch(postReplyForm.action, // send AJAX request to form's action URL
                {
                    method: 'POST', // use POST method
                    body: formData, // send form data as body
                    headers:
                    {
                        'X-CSRFToken': csrfToken, // include CSRF token for security
                        'X-Requested-With': 'XMLHttpRequest', // mark as AJAX request
                    },
                })
                .then(response => // handle response from server
                {
                    console.log("Received response from server:", response.status); // log response status
                    if (!response.ok) // check for server errors (like 400, 401, 500)
                    {
                        return response.json().then(errData => { throw errData; }).catch(() => { throw new Error(`HTTP error! status: ${response.status}`); }); // try to parse error details if server sent JSON, otherwise throw generic error
                    }
                    return response.json(); // parse successful JSON response
                })
                .then(data => // process successful data from server
                {
                    console.log('Success Data:', data); // log success data (for debugging)

                    const newPostDiv = document.createElement('div'); // create a new div element
                    newPostDiv.classList.add('post-container'); // add the same class as existing posts
                    newPostDiv.style.cssText = "margin-bottom: 20px; border: 1px solid #eee; padding: 10px; background-color: #f0fff0;"; // light green background

                    newPostDiv.innerHTML = `
                        <p>${data.content.replace(/\n/g, '<br>')}</p>
                        <small>
                            Posted by: ${data.author}
                            on ${data.created_at}
                        </small>
                    `;

                    postsContainer.appendChild(newPostDiv); // append new created div to posts container on the page

                    const noRepliesMsg = postsContainer.querySelector('p'); // find the "No replies" message (if it exists)
                    if (noRepliesMsg && noRepliesMsg.textContent.includes("No replies have been posted yet")) // if message exists and contains the specific text, remove it
                    {
                        noRepliesMsg.remove();
                    }

                    postReplyForm.reset(); // clear the form fields
                    console.log("Form reset."); // log form reset
                })
                .catch((error) => // handle fetch errors or errors thrown from .then()
                {
                    console.error('Error submitting post:', error); // log the error
                    alert('Failed to post reply. Please check your input or try again later.'); // show a simple error alert to user
                });
        });
    }
    else // if any required element wasn't found
    {
        console.error("Listener not added. Missing form, posts container, CSRF token, or submit button."); // log the reason
    }

    const likeButtons = document.querySelectorAll('.like-button'); // select all like buttons on the page when it loads
    console.log(`Found ${likeButtons.length} like buttons.`); // log how many buttons were found

    likeButtons.forEach(button => // add click event listener to each like button
    {
        button.addEventListener('click', function ()
        {
            const postId = this.dataset.postId; // get post ID from data-post-id
            const url = this.dataset.url; // get URL from data-url
            console.log(`Like button clicked for post ${postId}, URL: ${url}`); // log click

            fetch(url, // send fetch request to like/unlike URL
                {
                method: 'POST',
                    headers:
                    {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json' // sending/expecting JSON (I think its good practice so I added)
                },
            })
                .then(response =>
                {
                    console.log(`Like request response status for post ${postId}:`, response.status);
                    if (!response.ok) // handle errors
                    {
                        return response.json().then(errData => { throw errData; }).catch(() => { throw new Error(`HTTP error! status: ${response.status}`); }); // maybe show a more specific error?
                    }
                    return response.json(); // parse JSON response
                })
                .then(data => // process successful JSON data {message, post_id, liked, like_count}
                {
                    console.log(`Like request success data for post ${postId}:`, data);

                    const likeCountSpan = document.getElementById(`like-count-${postId}`); // find like count span for this post
                    if (likeCountSpan)
                    {
                        likeCountSpan.textContent = data.like_count; // update text content of span with new count
                    }

                    if (data.liked) // if user now likes the post
                    {
                        this.textContent = 'Unlike'; // change text to Unlike
                        this.classList.remove('btn-outline-danger'); // remove outline class
                        this.classList.add('btn-danger'); // add filled danger class
                    }
                    else // if user now doesnt like the post
                    {
                        this.textContent = 'Like'; // change text to Like
                        this.classList.remove('btn-danger'); // remove filled danger class
                        this.classList.add('btn-outline-danger'); // add outline class
                    }
                })
                .catch(error =>
                {
                    console.error(`Error liking/unliking post ${postId}:`, error);
                    alert('An error occurred while processing your like.');
                });
        });
    });

    const deleteConfirmButtons = document.querySelectorAll('.confirm-delete-button');
    console.log(`Found ${deleteConfirmButtons.length} delete confirmation buttons.`); // log count

    deleteConfirmButtons.forEach(button => // listener for each confirm button
    {
        button.addEventListener('click', function () {
            const postId = this.dataset.postId; // get post ID from button's data
            const url = this.dataset.url; // delete URL from button's data 
            const modalId = `#deleteConfirmModal-${postId}`; // construct  ID of the parent modal
            const modalElement = document.querySelector(modalId); // find parent modal element

            console.log(`Confirm delete button clicked for post ${postId}, URL: ${url}`); // log click

            fetch(url, // send fetch request to delete URL
                {
                method: 'POST', // use POST (view handles POST or DELETE)
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                    'Content-Type': 'application/json' // Specify content type
                }
            })
                .then(response => // handle response
                {
                    console.log(`Delete request response status for post ${postId}:`, response.status);
                    if (!response.ok) //  errors (403 Forbidden, 404 Not Found, 500 Server Error etc.)
                    {
                        return response.json().then(errData => { throw errData; }).catch(() => { throw new Error(`HTTP error! status: ${response.status}`); });
                    }
                    return response.json(); // parse JSON on success
                })
                .then(data => // process success data
                {
                    console.log(`Delete request success data for post ${postId}:`, data);
                    if (data.message === 'success') // check success message from view
                    {
                        const postElement = document.getElementById(`post-${postId}`); // find main container div for the post
                        if (postElement)
                        {
                            postElement.remove(); // remove post element from  page
                            console.log(`Removed post element ${postId} from DOM.`);
                        }
                        $(modalId).modal('hide'); // hide confirmation modal ( I used Bootstrap's jQuery )
                    }
                    else
                    {
                        throw data; // if wasn't 'success' act like an error
                    }
                })
                .catch(error =>// handle errors
                { 
                    console.error(`Error deleting post ${postId}:`, error);
                    alert(`Error deleting post: ${error.error || 'Please try again.'}`); // show error alert
                    $(modalId).modal('hide'); // hide modal even if there was an error
                });
        });
    });

    const editPostForms = document.querySelectorAll('.edit-post-form');
    console.log(`Found ${editPostForms.length} edit post forms.`);

    editPostForms.forEach(form =>
    {
        form.addEventListener('submit', function (event)
        {
            event.preventDefault(); // prevent default form submission

            const postId = this.dataset.postId;
            const url = this.dataset.url;
            const modalId = `#editPostModal-${postId}`;
            const contentTextarea = this.querySelector(`#edit-content-${postId}`); // find specific textarea within this form
            const newContent = contentTextarea?.value;

            console.log(`Edit form submitted for post ${postId}, URL: ${url}`);

            if (newContent === null || newContent === undefined)
            {
                console.error("Could not find content textarea or get its value.");
                alert("Error submitting edit.");
                return; // stop if can't found
            }

            const formData = new FormData(); // use FormData to send the content
            formData.append('content', newContent); // add content to form data

            fetch(url,
                {
                method: 'POST',
                body: formData, // send content as form data
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
                .then(response =>
                {
                    console.log(`Edit request response status for post ${postId}:`, response.status);
                    if (!response.ok)
                    {
                        return response.json().then(errData => { throw errData; }).catch(() => { throw new Error(`HTTP error! status: ${response.status}`); });
                    }
                    return response.json();
                })
                .then(data =>
                {
                    console.log(`Edit request success data for post ${postId}:`, data);
                    if (data.message === 'success')
                    {
                        const postContentElement = document.getElementById(`post-content-${postId}`); // find paragraph displaying post content on main page
                        if (postContentElement)
                        {
                            postContentElement.innerHTML = data.content_html; // update innerHTML with HTML version from response
                            console.log(`Updated post content ${postId} in DOM.`);
                        }
                        $(modalId).modal('hide'); // hide  edit modal
                    }
                    else
                    {
                        throw data; // treat it like error
                    }
                })
                .catch(error =>
                {
                    console.error(`Error editing post ${postId}:`, error);
                    alert(`Error editing post: ${error.error || 'Please try again.'}`);
                    $(modalId).modal('hide');
                });
        });
    });
});