import { BACKEND_PORT } from './config.js';//for the 5005 (avoids CORS problems)

//Login Page 
const loginUser = (email, password) => {
  const body = { email, password }; //body is object thats email+password
  fetch(`http://localhost:${BACKEND_PORT}/auth/login`, {
    method: 'POST', //post requirement
    headers: {
      'Content-Type': 'application/json', //for request body to be json format 
    },
    body: JSON.stringify(body), //for body object to be json string 
  })
  .then((response) => {
    if (!response.ok) {
      throw new Error('Failed to log in'); //in case response is not ok - 400 error (according to console)
    }
    return response.json(); //only parse body to json if response = ok
  })
  .then((data) => {
    if (data.error) 
    {
        showErrorModal(data.error); //in case of error, popup occurs
    } 
    else 
    {
      console.log('Login successful');//TO BE EDITED- currently logged to console
      localStorage.setItem('token', data.token); //to store the login token
     
      const token = data.token; 
      console.log("Stored token:", localStorage.getItem('token'));  // Debug step
      console.log("Passing token to loadJobFeed:", token); // Debug step
      selfWatch(email);
      loadJobFeed(token);
      showHomePage();
    }
  })
  .catch((error) => {
    
    showErrorModal('Login failed: ' + error.message); //to display the error message on page 
  });
};
const showErrorModal = (message) => {
    const errorMessageElement = document.getElementById('error-message');
    errorMessageElement.innerText = message;
    
    const errorModal = new bootstrap.Modal(document.getElementById('errorModal')); //bootstrap modal instance
    errorModal.show();//to display the modal on error
  };

document.getElementById('login-form').addEventListener('submit', (event) => { //handling form submission
  event.preventDefault(); //so page doesnt refresh 

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  loginUser(email, password);
});
//to display signup page on clicking 'create account'
document.getElementById('go-to-signup').addEventListener('click',()=>{
    document.getElementById("login-page").style.display = 'none';
    document.getElementById("signup-page").style.display = "flex";
});

//to display login page on clicking 'log in'
document.getElementById('go-to-login').addEventListener('click',()=>{
    document.getElementById("signup-page").style.display = 'none';
    document.getElementById("login-page").style.display = "flex";
});

//Signup Page 
const signupForm = document.getElementById('signup-form');

signupForm.addEventListener('submit', function (event) {
  event.preventDefault(); // preventing refresh 
  const name = document.getElementById('signup-name').value;
  const email = document.getElementById('signup-email').value;
  const password = document.getElementById('signup-password').value;
  const confirmPassword = document.getElementById('signup-confirm-password').value;

  if (password !== confirmPassword) {
      showErrorModal("Passwords Do Not Match. Try Again"); // password auth 
      return;
  }

  const signupData = { name, email, password }; // to add data to db

  // Using Promises instead of async/await
  fetch('http://localhost:5005/auth/register', {
      method: 'POST', // post requirement
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(signupData),
  })
  .then(function(response) {
      return response.json().then(function(data) {
          if (response.ok) { // successful registration
              alert('Signup successful!'); // temporary check - will remove later
              document.getElementById("signup-page").style.display = 'none'; // moving to login page after signup 
              document.getElementById("login-page").style.display = "flex";
          } else {
              showErrorModal(data.error || 'Incorrect Sign Up. Try Again.'); // in case of any backend error
          }
      });
  })
  .catch(function(error) {
      showErrorModal(`Signup failed: ${error.message}`); // to show the signup error
  });
});

const showHomePage = function () { // to hide login and signup and show the home page 
  document.getElementById("login-page").style.display = 'none';
  document.getElementById("signup-page").style.display = 'none';
  document.getElementById("logout-btn").style.display = "flex"; // just displaying the logout option in the navbar for now... must add others as I go 
  document.getElementById("add-job-btn").style.display = "flex";
  document.getElementById("profile-btn").style.display = "flex";

  displayFeed() 
  .then(function () {
  })
  .catch(function (error) {
      console.error('Error displaying feed:', error);
  });
};

document.getElementById("logout-btn").addEventListener("click", () => {
    localStorage.removeItem("authToken"); //to actually remove the token instance so no info retained
    console.log("logged out"); //temp check
    showLoginPage(); 
});
const showLoginPage = () => { //to hide login and signup and show the home page 
  document.getElementById("login-page").style.display = 'flex';
  document.getElementById("signup-page").style.display = 'none';
  document.getElementById("logout-btn").style.display = "none"; //just displaying the logout option in the navbar for now... must add others as I go 
};

//FOR SIGNUP PAGE - add alets whenever you leave a field empty, name shouldnt have special chars , email should be of the form xyz@abc.com , cant leave anything blank. 
//HOME PAGE - need to display other elements in the navbar. 


//api call(used started code from 6080 portal for ref.)
//api call (used started code from 6080 portal for ref.)
const apiCall = function (path, token, queryString) {
  return fetch('http://localhost:5005/' + path + '?' + queryString, {
    method: 'GET', //get requests for jobs and users- need to work on the users part
    headers: {
      'Content-type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
  })
  .then(function (response) {
    return response.json().then(function (data) {
      if (!response.ok) {
        console.error("API Error:", data.error || "Unknown error");
        return Promise.reject(new Error(data.error || "API request failed"));
      }

      return data;
    });
  })
  .catch(function (error) {
    console.error("Fetch error:", error.message);
    alert("API Call failed: " + error.message);
  })
  .then(function (data) {
    if (Array.isArray(data)) {
      displayFeed(data);  //to show us the data in feed
    }
  })
  .catch(function (error) {
    console.error("Error in API call:", error);
  });
};

// to calculate time difference - need to integrate later 
function getTimeDifference(postDate) {
  const now = new Date();
  const postedAt = new Date(postDate);
  const diff = now - postedAt;
  
  const hoursAgo = Math.floor(diff / (1000 * 60 * 60));
  const minutesAgo = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hoursAgo < 24) {
    return `${hoursAgo} hours and ${minutesAgo} minutes ago`;
  } else {
    return postedAt.toLocaleDateString('en-GB');
  }
}
function formatStartDate(dateString) {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  
  return `${day}/${month}/${year}`;
}


function isValidStartDate(startDateString) {
  const startDate = new Date(startDateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0); 

  
  return startDate >= today;
}

function displayFeed(jobs, user, containerId = 'job-feed') {
  console.log("Jobs received in displayFeed:", jobs);
  const token = getToken();
  console.log("token in display feed", token);

  //to chheck if the token is being retrieved correctly
  console.log(getToken());
  if (!Array.isArray(jobs)) {
    return;
  }

  const feedContainer = document.getElementById(containerId);

  jobs.forEach(function(job) {
    const creatorId = job.creatorId;
    console.log("creator-id", creatorId);

    getUserNameById(creatorId, token)
      .then(function(creatorName) {
        creatorName = creatorName || "Unknown User";
        console.log(`Job ID: ${job.id}, Creator ID: ${creatorId}, Resolved Creator Name: ${creatorName}`);

        const jobElement = document.createElement('div');
        jobElement.classList.add('job-post');

        const jobImage = document.createElement('img'); //job img
        jobImage.src = job.image || '';
        jobImage.alt = job.title;
        jobImage.style.width = '100px';  //trying to make it look more like an icon

        const jobText = document.createElement('div');
        jobText.classList.add('job-text');

        const jobTitle = document.createElement('h4');
        jobTitle.textContent = `${job.title}`;

        const author = document.createElement('h3');
        author.textContent = 'Posted by: ';
        const profileLink = document.createElement('a');
        profileLink.href = '#';
        profileLink.classList.add('profile-link');
        profileLink.setAttribute('data-user-id', creatorId);
        profileLink.textContent = creatorName;
        author.appendChild(profileLink);

        const postTime = document.createElement('p');
        postTime.textContent = `Posted: ${getTimeDifference(job.createdAt)}`;

        const jobStart = formatStartDate(job.start);
        const jobStartDate = document.createElement('p');
        jobStartDate.textContent = `Start Date: ${jobStart}`;
        if (!isValidStartDate(job.start)) {
          jobStartDate.textContent = `Start Date: Already Expired`;
        }

        const jobDescription = document.createElement('p');
        jobDescription.textContent = job.description;

        const userId = getUserIdFromToken(token);
        const likeButtonContainer = document.createElement('div');
        likeButtonContainer.classList.add('like-button-container');

        const likeButton = document.createElement('button');
        likeButton.textContent = 'Like';

        let isLiked = job.likes && job.likes.some(like => like.userId === userId);
        likeButton.textContent = isLiked ? 'Unlike' : 'Like'; //to update based on whether post is liked or not

        likeButton.addEventListener('click', function() {
          const turnOn = !isLiked;
          likeJob(job.id, turnOn).then(function() {
            isLiked = turnOn; //to update isliked status
            likeButton.textContent = isLiked ? 'Unlike' : 'Like'; //the button should update according to state
          });
        });
        likeButtonContainer.appendChild(likeButton);

        //need to toggle likes
        console.log(job.likes)
        console.log("has the user liked the post?", isLiked);
        const jobLikes = document.createElement('p'); 
        const likeCount = Object.keys(job.likes || {}).length || 0; //to calculate like count
        jobLikes.textContent = `Likes: ${likeCount}`; //likes button
        const jobLikesButton = document.createElement('button');
        jobLikesButton.textContent = "Show Likes";
        jobLikesButton.classList.add('like-toggle'); //to toggle the likes
        const likesContainer = document.createElement('div');
        likesContainer.classList.add('likes-list'); 
        likesContainer.style.display = "none"; //like container shouldn't show initially

        jobLikesButton.addEventListener('click', function() {
          if (likesContainer.style.display === "none") {  // Toggle visibility
            console.log("Showing likes...");

            if (likesContainer.textContent === "" || likesContainer.textContent === "Loading...") {
              likesContainer.textContent = "Loading...";  

              Promise.all(job.likes.map(function(like) {
                return getUserNameById(like.userId, token)
                  .then(function(likerName) {
                    likerName = likerName || "Unknown User"; 
                    const likerParagraph = document.createElement('p');
                    const likerAnchor = document.createElement('a');
                    likerAnchor.href = '#';
                    likerAnchor.classList.add('profile-link');
                    likerAnchor.setAttribute('data-user-id', like.userId);
                    likerAnchor.textContent = likerName;
                    likerParagraph.appendChild(likerAnchor);
                    return likerParagraph;
                  });
              })).then(function(userNames) {
                
                userNames.forEach(userNameElement => likesContainer.appendChild(userNameElement));
                if (userNames.length === 0) {
                  const noLikesParagraph = document.createElement('p');
                  noLikesParagraph.textContent = 'No likes yet';
                  likesContainer.appendChild(noLikesParagraph);
                }
              });
            }

            likesContainer.style.display = "block";  
            jobLikesButton.textContent = "Hide Likes";  
          } else {
            likesContainer.style.display = "none";  
            jobLikesButton.textContent = "Show Likes";  
          }
        });

        const commentButton = document.createElement('button');
        commentButton.textContent = 'Comment';
        commentButton.classList.add('btn', 'btn-info');
        commentButton.addEventListener('click', function() {
          openCommentModal(job.id);  
        });

        //working on toggling comments on and off
        const jobComments = document.createElement('p'); //to get the comments
        jobComments.textContent = `Comments: ${job.comments?.length || 'None'}`; //in case there are no comments show none
        const jobCommentsButton = document.createElement('button'); //show comments button
        jobCommentsButton.textContent = "Show Comments"; 
        jobCommentsButton.classList.add('comment-toggle'); //for toggle option
        const commentsContainer = document.createElement('div');
        commentsContainer.classList.add('comments-list'); 
        commentsContainer.style.display = "none";

        jobCommentsButton.addEventListener('click', function() {

          if (commentsContainer.style.display === "none") { //for the toggling styles feature
            console.log("Showing comments...");

            if (commentsContainer.textContent === "" || commentsContainer.textContent === "Loading...") {
              const comments = job.comments || [];
              Promise.all(comments.map(function(comment) {
                return getUserNameById(comment.userId, token)
                  .then(function(commenterName) {
                    commenterName = commenterName || "Unknown User";
                    const commentParagraph = document.createElement('p');
                    const commenterAnchor = document.createElement('a');
                    commenterAnchor.href = '#';
                    commenterAnchor.classList.add('profile-link');
                    commenterAnchor.setAttribute('data-user-id', comment.userId);
                    commenterAnchor.textContent = commenterName;
              
                    commentParagraph.appendChild(commenterAnchor);
                    commentParagraph.appendChild(document.createTextNode(`: ${comment.comment}`));
                    return commentParagraph;
                  });
              })).then(function(commentElements) {
                commentElements.forEach(commentElement => commentsContainer.appendChild(commentElement));
                if (commentElements.length === 0) {
                  const noCommentsParagraph = document.createElement('p');
                  noCommentsParagraph.textContent = 'No comments yet';
                  commentsContainer.appendChild(noCommentsParagraph);
                }
              });
            }

            commentsContainer.style.display = "block"; //displaying comments container
            jobCommentsButton.textContent = "Hide Comments"; //if the comments container is open, we need to change text of button to 'hide'
          } else {
            commentsContainer.style.display = "none"; //hid the comments
            jobCommentsButton.textContent = "Show Comments"; //changing button text back 
          }
        });

        console.log("User Id and Creator ID:", userId === creatorId);

        jobText.appendChild(jobTitle);
        jobText.appendChild(author);
        jobText.appendChild(postTime);
        jobText.appendChild(jobStartDate);
        jobText.appendChild(jobDescription);
        jobText.appendChild(likeButtonContainer);
        jobText.appendChild(jobLikes);  
        jobText.appendChild(jobLikesButton); 
        jobText.appendChild(commentButton);
        jobText.appendChild(likesContainer); 
        jobText.appendChild(jobComments);
        jobElement.appendChild(jobImage);
        jobText.appendChild(jobCommentsButton);  
        jobText.appendChild(commentsContainer);

        if (String(userId) === String(creatorId)) {
          const updateButton = document.createElement('button');
          updateButton.textContent = 'Update';
          updateButton.classList.add('update-job-btn');
          updateButton.addEventListener('click', function() {
            console.log("Updating job", job.id);
            openUpdateModal(job);
          });

          const deleteButton = document.createElement('button');
          deleteButton.textContent = 'Delete';
          deleteButton.classList.add('delete-job-btn');
          deleteButton.addEventListener('click', function() {
            const confirmDelete = confirm("Are you sure you want to delete this job?");
            if (confirmDelete) {
              deleteJob(job.id)
                .then(function() {
                  jobElement.remove();
                });
            }
          });

          jobText.appendChild(updateButton);
          jobText.appendChild(deleteButton);
        }
        jobElement.appendChild(jobText);
        feedContainer.appendChild(jobElement);
      })
      .catch(function(error) {
        console.error("Error getting creator name:", error);
      });
  });
}




function loadJobFeed(token) {
  apiCall('job/feed', token, 'start=0')
    .then(function(jobData) {
      if (!jobData || !Array.isArray(jobData.jobs)) {
        return;
      }

      displayFeed(jobData.jobs, usersData, 'job-feed');
    })
    .catch(function(error) {
      console.error("Error fetching job feed:", error);
      alert("Error fetching the job feed.");
    });
}


const getToken = () => localStorage.getItem('token');

function getUserNameById(creatorId, token) {
  return fetch(`http://localhost:5005/user?userId=${creatorId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    }
  })
  .then(function(response) {
    return response.json();
  })
  .then(function(userData) {
    return userData.name;
  })
  .catch(function(error) {
    console.error("Error fetching user name:", error);
  });
}

//to like a job
function likeJob(jobId, turnon) {
  const token = getToken();
  const data = {
    id: jobId,
    turnon: turnon
  };

  return fetch('http://localhost:5005/job/like', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  })
  .then(function(response) {
    if (response.ok) {
      console.log(`Job ${jobId} like status updated.`);
    } else {
      console.error('Error liking the job:', response.statusText);
    }
  })
  .catch(function(error) {
    console.error('Error sending like request:', error);
  });
}


//my fetch was getting messed up so i used token to directly extract the user id- reference: https://stackoverflow.com/questions/56753929/how-to-get-user-id-using-jwt-token
function getUserIdFromToken(token) {
  try {
      const parts = token.split('.');
      if (parts.length !== 3) {
          throw new Error('Invalid token format');
      }
      const payload = parts[1];
      const padding = '='.repeat((4 - (payload.length % 4)) % 4);
      const base64 = payload + padding;
      const decoded = atob(base64);
      const jsonPayload = JSON.parse(decoded);
      return jsonPayload.userId; 
  } catch (error) {
      console.error('Error decoding token:', error);
      return null;
  }
}

function showProfilePage(userId) { 
  // to show the profile page whenever the user clicks on someone's name
  document.getElementById('login-page').style.display = 'none';
  document.getElementById('signup-page').style.display = 'none';
  document.getElementById('job-feed').style.display = 'none';
  document.getElementById('profile-page').style.display = 'flex'; // to only show the profile page and hide everything else 

  const token = getToken();
  
  return fetch(`http://localhost:5005/user?userId=${userId}`, { // to fetch all user details
    method: 'GET',
    headers: { 'Authorization': `Bearer ${token}` }
  })
  .then(function(response) {
    if (!response.ok) throw new Error("Could not fetch user profile.");

    return response.json();
  })
  .then(function(user) {
    const profileContainer = document.getElementById("profile-container");

    // Clear any existing content before adding new content
    while (profileContainer.firstChild) {
      profileContainer.removeChild(profileContainer.firstChild);
    }

    // Create the profile content
    const nameHeading = document.createElement('h2');
    nameHeading.textContent = user.name;

    const emailParagraph = document.createElement('p');
    emailParagraph.textContent = `Email: ${user.email}`;

    const watchedByParagraph = document.createElement('p');
    watchedByParagraph.textContent = `Watched by: ${Object.keys(user.usersWhoWatchMeUserIds || {}).length} users`;

    const jobPostedHeader = document.createElement('h3');
    jobPostedHeader.id = 'job-posted-header';
    jobPostedHeader.textContent = 'Jobs Posted:';

    const userJobsContainer = document.createElement('div');
    userJobsContainer.id = 'user-jobs-container';
    userJobsContainer.textContent = 'Loading...'; // This will be updated later

    const editProfileButton = document.createElement('button');
    editProfileButton.id = 'edit-profile-btn';
    editProfileButton.classList.add('btn', 'btn-secondary');
    editProfileButton.textContent = 'Edit Profile';

    editProfileButton.addEventListener('click', function() {
      displayUpdateProfileForm(user);
    });

    //to append the form elems
    profileContainer.appendChild(nameHeading);
    profileContainer.appendChild(emailParagraph);
    profileContainer.appendChild(watchedByParagraph);
    profileContainer.appendChild(jobPostedHeader);
    profileContainer.appendChild(userJobsContainer);
    profileContainer.appendChild(editProfileButton);

   
    if (userId === getUserIdFromToken(token)) {
    } else {

      getWatchStatus(user.email, userId);
    }

    return displayUserJobs(userId);
  })
  .catch(function(err) {
    console.error("Failed to load profile:", err);
  });
}



function displayUserJobs(userId) { // to actually display the job
  const token = getToken();

  return fetch('http://localhost:5005/job/feed?start=0', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
  .then(function(response) {
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    return response.json();
  })
  .then(function(jobData) {
    const jobsContainer = document.getElementById("user-jobs-container"); // to format the jobs inside a container
    const usersData = '';
    const selfId = getUserIdFromToken(token);
    console.log("job data:", jobData);

    // Clear any existing content in the jobs container before adding new content
    while (jobsContainer.firstChild) {
      jobsContainer.removeChild(jobsContainer.firstChild);
    }

    if (Array.isArray(jobData)) {
      const userJobs = jobData.filter(job => String(job.creatorId) === String(userId)); // converting both to string before comparing
      console.log("userJobs creators:, userJobs userID", userId);
      console.log("userJobs:", userJobs);

      if (userJobs.length > 0) { // if the user has job posts
        displayFeed(userJobs, usersData, 'user-jobs-container');
      } else {
        console.log("No jobs found for this user.");
        const noJobsMessage = document.createElement('p');
        noJobsMessage.textContent = 'No jobs found for this user.';
        jobsContainer.appendChild(noJobsMessage);
      }
    } else if (jobData && jobData.jobs && Array.isArray(jobData.jobs)) { // format check - will remove later
      const userJobs = jobData.jobs.filter(job => String(job.creatorId) === String(userId)); 

      if (userJobs.length > 0) {
        displayFeed(userJobs, usersData, 'user-jobs-container');
      } else {
        console.log("No jobs found for this user.");
        const noJobsMessage = document.createElement('p');
        noJobsMessage.textContent = 'No jobs found for this user.';
        jobsContainer.appendChild(noJobsMessage);
      }
    } else {
      console.error("Invalid job data format:", jobData);
      const errorMessage = document.createElement('p');
      errorMessage.textContent = 'Error loading job feed.';
      jobsContainer.appendChild(errorMessage);
    }

    jobsContainer.style.display = 'flex';
  })
  .catch(function(error) {
    console.error("Error fetching jobs:", error);
    const errorMessage = document.createElement('p');
    errorMessage.textContent = 'Error loading job feed.';
    document.getElementById('user-jobs-container').appendChild(errorMessage);
  });
}



document.addEventListener('click', (event) => { //to direct to profile page upon clicking a name 
  if (event.target.classList.contains('profile-link')) {
      event.preventDefault();
      const userId = event.target.getAttribute('data-user-id');
      showProfilePage(userId);
  }
}); 


document.getElementById("profile-btn").addEventListener("click", () => { //to show the profile page upon clicking on 'profile' in the navbar
  const token = getToken();
  const userId = getUserIdFromToken(token);
  showProfilePage(userId);
});

function displayUpdateProfileForm(user) { // to update the profile - needs checks for email throws error even though it updates
  const profileContainer = document.getElementById('profile-container');


  // Create the update profile form dynamically
  const form = document.createElement('form');
  form.id = 'update-profile-form';
  form.enctype = 'multipart/form-data';
  form.className = 'p-4 border rounded bg-light';

  // Create the name input field
  const nameDiv = document.createElement('div');
  nameDiv.className = 'mb-3';
  const nameLabel = document.createElement('label');
  nameLabel.setAttribute('for', 'new-name');
  nameLabel.className = 'form-label';
  nameLabel.textContent = 'Name';
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.className = 'form-control';
  nameInput.id = 'new-name';
  nameInput.name = 'name';
  nameInput.value = user.name;
  nameInput.placeholder = 'Enter your name (optional)';
  nameDiv.appendChild(nameLabel);
  nameDiv.appendChild(nameInput);

  // Create the email input field
  const emailDiv = document.createElement('div');
  emailDiv.className = 'mb-3';
  const emailLabel = document.createElement('label');
  emailLabel.setAttribute('for', 'new-email');
  emailLabel.className = 'form-label';
  emailLabel.textContent = 'Email';
  const emailInput = document.createElement('input');
  emailInput.type = 'email';
  emailInput.className = 'form-control';
  emailInput.id = 'new-email';
  emailInput.name = 'email';
  emailInput.value = user.email;
  emailInput.placeholder = 'Enter your email (optional)';
  emailDiv.appendChild(emailLabel);
  emailDiv.appendChild(emailInput);

  // Create the password input field
  const passwordDiv = document.createElement('div');
  passwordDiv.className = 'mb-3';
  const passwordLabel = document.createElement('label');
  passwordLabel.setAttribute('for', 'new-password');
  passwordLabel.className = 'form-label';
  passwordLabel.textContent = 'Password';
  const passwordInput = document.createElement('input');
  passwordInput.type = 'password';
  passwordInput.className = 'form-control';
  passwordInput.id = 'new-password';
  passwordInput.name = 'password';
  passwordInput.placeholder = 'Enter new password (optional)';
  passwordDiv.appendChild(passwordLabel);
  passwordDiv.appendChild(passwordInput);

  // Create the confirm password input field
  const confirmPasswordDiv = document.createElement('div');
  confirmPasswordDiv.className = 'mb-3';
  const confirmPasswordLabel = document.createElement('label');
  confirmPasswordLabel.setAttribute('for', 'new-confirm-password');
  confirmPasswordLabel.className = 'form-label';
  confirmPasswordLabel.textContent = 'Confirm Password';
  const confirmPasswordInput = document.createElement('input');
  confirmPasswordInput.type = 'password';
  confirmPasswordInput.className = 'form-control';
  confirmPasswordInput.id = 'new-confirm-password';
  confirmPasswordInput.name = 'confirm-password';
  confirmPasswordInput.placeholder = 'Confirm your new password (optional)';
  confirmPasswordDiv.appendChild(confirmPasswordLabel);
  confirmPasswordDiv.appendChild(confirmPasswordInput);

  // Create the image input field
  const imageDiv = document.createElement('div');
  imageDiv.className = 'mb-3';
  const imageLabel = document.createElement('label');
  imageLabel.setAttribute('for', 'new-image');
  imageLabel.className = 'form-label';
  imageLabel.textContent = 'Profile Image';
  const imageInput = document.createElement('input');
  imageInput.type = 'file';
  imageInput.className = 'form-control';
  imageInput.id = 'new-image';
  imageInput.name = 'image';
  imageInput.accept = 'image/*';
  imageDiv.appendChild(imageLabel);
  imageDiv.appendChild(imageInput);

  // Create the submit button
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = 'btn btn-primary';
  submitButton.textContent = 'Update Profile';

  // Append all elements to the form
  form.appendChild(nameDiv);
  form.appendChild(emailDiv);
  form.appendChild(passwordDiv);
  form.appendChild(confirmPasswordDiv);
  form.appendChild(imageDiv);
  form.appendChild(submitButton);

  // Append the form to the profile container
  profileContainer.appendChild(form);

  // Add the event listener for the form submission
  form.addEventListener('submit', function(event) {
    event.preventDefault();
    
    // for new values that we enter
    const updatedName = document.getElementById('new-name').value.trim();
    const updatedEmail = document.getElementById('new-email').value.trim();
    const updatedPassword = document.getElementById('new-password').value.trim();
    const confirmPassword = document.getElementById('new-confirm-password').value.trim();
    
    if (updatedPassword !== confirmPassword) { // making sure the passwords match
      console.log("updated pass, confirmpass=", updatedPassword, confirmPassword);
      alert('Passwords do not match!');
      return;
    }

    const imageInput = document.getElementById('new-image');
    let imageBase64 = null; // since Swagger specifies base64 image string... must check

    if (imageInput.files.length > 0) {
      const reader = new FileReader();
      reader.onload = function() {
        imageBase64 = reader.result.split(',')[1]; // to extract the base64 img
        submitProfileUpdate();
      };
      reader.readAsDataURL(imageInput.files[0]);
    } else {
      submitProfileUpdate();
    }

    function submitProfileUpdate() {
      const submitButton = document.querySelector('button[type="submit"]');
      submitButton.disabled = true;

      const token = getToken();
      const userId = getUserIdFromToken(token);

      // create the request body
      const updatedData = {
        userId: userId,
        name: updatedName,
        email: updatedEmail,
        password: updatedPassword,
        image: imageBase64
      };

      updateProfile(updatedData, token)
        .then(function(response) {
          if (response.ok) {
            return response.json();
          } else {
            throw new Error('Failed to update profile: ' + response.statusText);
          }
        })
        .then(function(updatedUser) {
          console.log("User updated successfully:", updatedUser);
          showProfilePage(userId);
        })
        .catch(function(error) {
          console.error('Error updating profile:', error);
        })
        .finally(function() {
          submitButton.disabled = false; // re-enable the submit button after the request is finished
        });
    }
  });

  function updateProfile(updatedData, token) {
    return new Promise(function(resolve, reject) {
      fetch(`http://localhost:5005/user?userId=${updatedData.userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      })
        .then(function(response) {
          resolve(response);
        })
        .catch(function(error) {
          reject(error);
        });
    });
  }
}


function getWatchStatus(targetUserEmail, targetUserId) {
  const token = getToken();
  const currentUserId = getUserIdFromToken(token);

  const profileContainer = document.getElementById('profile-container');

  const watchButton = document.createElement('button');
  watchButton.id = 'watch-button';
  watchButton.classList.add('btn', 'btn-primary');
  watchButton.textContent = 'Loading...';
  profileContainer.appendChild(watchButton);

  // Fetch the target user's details to check the watch status
  fetch(`http://localhost:5005/user?userId=${targetUserId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Failed to fetch user details.');
      }
      return response.json();
    })
    .then(function(targetUser) {
      const isWatching = targetUser.usersWhoWatchMeUserIds?.includes(Number(currentUserId));

      watchButton.textContent = isWatching ? 'Unwatch' : 'Watch'; // Toggle button text

      watchButton.addEventListener('click', function() {
        const turnOn = !isWatching;

        // Update the watch status (watch/unwatch)
        updateWatchStatus(targetUserEmail, turnOn, token)
          .then(function(updated) {
            console.log('Watch status updated:', updated);
            watchButton.textContent = turnOn ? 'Unwatch' : 'Watch';
          })
          .catch(function(error) {
            console.error('Failed to update watch status:', error);
            alert('Failed to update watch status. Please try again.');
          });
      });
    })
    .catch(function(error) {
      console.error('Error fetching watch status:', error);
      watchButton.textContent = 'Watch';
    });

  // Function to update the watch status on the server
  function updateWatchStatus(targetUserEmail, turnOn, token) {
    return new Promise(function(resolve, reject) {
      fetch('http://localhost:5005/user/watch', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: targetUserEmail,
          turnon: turnOn,
        }),
      })
        .then(function(response) {
          if (response.ok) {
            return response.json();
          } else {
            reject('Failed to update watch status');
          }
        })
        .then(resolve)
        .catch(reject);
    });
  }
}



document.getElementById('add-job-btn').addEventListener('click', function() {
  const modal = new bootstrap.Modal(document.getElementById('addJobModal'));
  modal.show(); // Show the add job modal when we click on the add job button
});

document.getElementById('add-job-form').addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent the default form submission

  const token = getToken();
  // Get values from the modal form
  const title = document.getElementById('job-title').value;
  const dateInput = document.getElementById('job-date').value;
  const description = document.getElementById('job-description').value;
  const imageFile = document.getElementById('job-image').files[0];
  let base64Image = '';

  // Convert image to base64 if a file is selected
  if (imageFile) {
    toBase64(imageFile)
      .then(function(base64) {
        base64Image = base64;
        submitJob(title, base64Image, dateInput, description, token);
      })
      .catch(function(error) {
        console.error('Error converting image to base64:', error);
        alert('There was an error with the image. Please try again.');
      });
  } else {
    submitJob(title, base64Image, dateInput, description, token);
  }
});

function submitJob(title, base64Image, dateInput, description, token) {
  const isoDate = new Date(dateInput).toISOString();

  fetch('http://localhost:5005/job', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      title: title,
      image: base64Image,
      start: isoDate,
      description: description
    })
  })
    .then(function(response) {
      if (response.ok) {
        return response.json(); // Return the JSON response on success
      } else {
        return response.text().then(function(errMsg) {
          throw new Error('Error posting job: ' + errMsg);
        });
      }
    })
    .then(function() {
      alert('Job posted successfully!');
      const modalElement = document.getElementById('addJobModal');
      const modalInstance = bootstrap.Modal.getInstance(modalElement);
      modalInstance.hide();
      document.getElementById('add-job-form').reset();
    })
    .catch(function(error) {
      console.error(error);
      alert(error.message || 'Something went wrong. Please try again.');
    });
}


function toBase64(file) {//helper function for reading the file and converting to appropriate format 
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

function selfWatch(email) {
  const token = getToken();

  fetch('http://localhost:5005/user/watch', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      turnon: true,
    })
  })
    .then(function(response) {
      if (!response.ok) {
        return response.text().then(function(errMsg) {
          throw new Error('Failed to self-watch the user: ' + errMsg);
        });
      }
      console.log('Successfully added self-watch for the user');
    })
    .catch(function(error) {
      console.error('Error during self-watch:', error);
    });
}


function openUpdateModal(job) {
  // modal fields have job data
  document.getElementById('updateTitle').value = job.title;
  document.getElementById('updateDescription').value = job.description;
  document.getElementById('updateStart').value = formatStartDate(job.start);  

  const updateModal = new bootstrap.Modal(document.getElementById('updateJobModal'));
  updateModal.show();
  document.getElementById('updateJobForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const updatedJob = {
      id: job.id,
      title: document.getElementById('updateTitle').value,
      description: document.getElementById('updateDescription').value,
      start: document.getElementById('updateStart').value,
      image: job.image,
    };

    updateJob(updatedJob)
      .then(function() {
        updateModal.hide();
      })
      .catch(function(error) {
        console.error("Error updating job:", error);
        alert("Error updating job. Please try again.");
      });
  });
}


//update job
function updateJob(jobData) {
  const token = getToken();  
  return fetch('http://localhost:5005/job', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(jobData),
  })
    .then(function(response) {
      if (response.ok) {
        console.log('Job updated successfully');
        //maybe can refresh immediately - check later
      } else {
        console.error('Failed to update job');
      }
    })
    .catch(function(error) {
      console.error('Error updating job:', error);
    });
}


//delete job
function deleteJob(jobId) {
  const token = getToken();  

  return fetch('http://localhost:5005/job', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ id: jobId }), 
  })
    .then(function(response) {
      if (response.ok) {
        console.log('Job deleted successfully');
        const jobElement = document.querySelector(`[data-job-id="${jobId}"]`);
        if (jobElement) {
          jobElement.remove(); //removes the job immediately
        }
      } else {
        console.error('Failed to delete job');
      }
    })
    .catch(function(error) {
      console.error('Error deleting job:', error);
    });
}


function openCommentModal(jobId) {
  const commentInput = document.getElementById('commentInput');
  const submitCommentButton = document.getElementById('submitCommentButton');

  commentInput.value = '';

  const commentModal = new bootstrap.Modal(document.getElementById('commentModal'));
  commentModal.show();

  submitCommentButton.onclick = function () {
    const commentText = commentInput.value.trim();
    if (!commentText) {
      alert("Please write a comment before submitting.");//if empty
      return;
    }
    
    commentOnJob(jobId, commentText)
      .then(function () {
        commentModal.hide();
      })
      .catch(function (error) {
        console.error('Error commenting on job:', error);
        alert('There was an error submitting your comment. Please try again.');
      });
  };
}


function commentOnJob(jobId, commentText) {//to update backend
  const token = getToken();  
  return fetch('http://localhost:5005/job/comment', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: jobId,
      comment: commentText,
    }),
  })
  .then(function(response) {
    if (response.ok) {
      console.log('Comment posted successfully');
    } else {
      console.error('Failed to post comment');
    }
  })
  .catch(function(error) {
    console.error('Error posting comment:', error);
  });
}


