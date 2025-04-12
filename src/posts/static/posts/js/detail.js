Dropzone.autoDiscover = false;

document.addEventListener('DOMContentLoaded', function () {
    console.log("DOM fully loaded.");
    const postReplyForm = document.getElementById('post-reply-form'); // find the form
    const postsContainer = document.getElementById('posts-container'); // find the container for posts
    const submitButton = document.getElementById('post-reply-submit-button'); // find submit button by ID
    console.log("Form found:", postReplyForm);
    console.log("Posts container found:", postsContainer);
    console.log("Submit button found:", submitButton);
    const topicPkElement = document.querySelector('[data-topic-id]');
    const topicPk = topicPkElement?.dataset.topicId;
    const csrfInput = postReplyForm?.querySelector('input[name=csrfmiddlewaretoken]'); // find csrf input element
    const csrfToken = csrfInput?.value; // get csrf token value
    console.log("CSRF input found:", csrfInput);
    console.log("CSRF token found:", csrfToken);
    console.log("Topic PK found:", topicPk);
    const uploadUrl = topicPk ? `/upload/${topicPk}/` : null;
    console.log("Upload URL:", uploadUrl);

    let myDropzone = null; // hold the Dropzone
    if (postReplyForm && postReplyForm.classList.contains('dropzone')) // check if element exists and is a dropzone
    {
        myDropzone = new Dropzone("#post-reply-form",
            {
            url: uploadUrl,
            autoProcessQueue: false, // don't upload files automatically when added
            uploadMultiple: true, // allow uploading multiple files in one request
            parallelUploads: 5, // max 5 files to upload parallel
            maxFiles: 5, // max 5 of files allowed
            paramName: "file", // name of the file par
                addRemoveLinks: true, // show remove links for uploaded files
                headers: // add CSRF token to Dropzone requests
                { 
                    'X-CSRFToken': csrfToken
                },
                init: function ()
                {
                const submitButton = document.getElementById('post-reply-submit-button');
                const dz = this; // reference to Dropzone 
                    submitButton.addEventListener('click', function () // listener for the modal's submit button
                    {
                        console.log("Submit button clicked for Dropzone.");
                        const textContent = postReplyForm.querySelector('textarea[name="content"]').value; // check if there's text OR files before processing
                        if (dz.getQueuedFiles().length > 0 || textContent.trim() !== '')
                        {
                            dz.processQueue();
                        }
                        else
                        {
                            alert("Please add content or files to post."); // alert if nothing to submit
                        }
                    });

                    this.on("sendingmultiple", function (file, xhr, formData) // event before sending files (and text content)
                    {
                        const textContent = postReplyForm.querySelector('textarea[name="content"]').value; // append text and CSRF token before sending
                        formData.append("content", textContent); // backend view will get this from request.POST
                        console.log("Dropzone sending files with content:", textContent); // CSRF handled by headers option now
                    });

                    this.on("successmultiple", function (files, response) // successful upload (of files and text data)
                    {
                        console.log("Dropzone successmultiple:", response); // log JSON response from the view
                        if (response.message === 'success') // check success message from our view
                        {
                            const newPostDiv = document.createElement('div'); // create new div
                            newPostDiv.classList.add('post-container'); // add styling class
                            newPostDiv.setAttribute('id', `post-${response.post_id}`); // set unique ID for the new post
                            newPostDiv.style.cssText = "margin-bottom: 20px; border: 1px solid #eee; padding: 10px; background-color: #f0fff0;";

                            let photosHTML = '';
                            if (response.photo_urls && response.photo_urls.length > 0) {
                                photosHTML = '<div class="post-photos" style="margin-top: 10px;">';
                                response.photo_urls.forEach(url => {
                                    photosHTML += `<img src="${url}" alt="Photo for post ${response.post_id}" style="max-width: 150px; height: auto; margin-right: 5px;">`;
                                });
                                photosHTML += '</div>';
                            }

                            newPostDiv.innerHTML = `
                            <p id="post-content-${response.post_id}">${response.content_html}</p> {# Use pre-rendered HTML #}
                            <small>
                                Posted by: ${response.author}
                                on ${response.created_at}
                                <span style="margin-left: 15px;">
                                    Likes: <span id="like-count-${response.post_id}">${response.like_count}</span>
                                    {# TODO: Add like/edit/delete buttons dynamically for new post #}
                                </span>
                            </small>
                            ${photosHTML} {# Include photos HTML if any #}
                        `;
                            postsContainer.appendChild(newPostDiv);

                            const noRepliesMsg = postsContainer.querySelector('p'); // remove "No replies" message if it was there
                            if (noRepliesMsg && noRepliesMsg.textContent.includes("No replies have been posted yet"))
                            {
                                noRepliesMsg.remove();
                            }

                            dz.removeAllFiles(); // clear Dropzone previews
                            postReplyForm.reset(); // clear text area
                            $('#createPostModal').modal('hide'); // close modal using jQuery from Bootstrap bundle
                            console.log("Post created, form reset, Dropzone cleared, modal closed.");
                        }
                        else
                        {
                            alert(`Error: ${response.error || 'Failed to create post.'}`); // backend returns 200 OK but with an error message in JSON
                        }
                    });

                    this.on("errormultiple", function (files, response) // event on upload error
                    {
                        console.error("Dropzone errormultiple:", response);
                        const message = (typeof response === 'object' && response !== null && response.error) ? response.error : 'Upload failed. Please try again';
                        alert(`Error uploading files: ${message}`);
                    });

                }
            });
        console.log("Dropzone initialized for #post-reply-form");
    } else // if Dropzone couldn't be initialized
    { 
        console.error("Dropzone form, Upload URL, CSRF token, submit button or posts container not found. Dropzone NOT initialized.");
        if (submitButton) // fallback 
        {
            submitButton.addEventListener('click', () => alert('Error: Reply functionality not available.'));
        }
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