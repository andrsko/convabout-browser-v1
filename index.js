import { API_URL } from "./api.js";

let tag = "";
let q = "";
const parser = document.createElement("a");
parser.href = window.location.href;
if (parser.pathname.substring(0, 5) === "/tag/") {
  tag = parser.pathname.substring(5);
  if (tag.charAt(tag.length - 1) === "/") tag = tag.slice(0, -1);
} else if (parser.pathname === "/search") {
  q = new URL(window.location.href).searchParams.get("q");
}

const homeContainer = document.getElementById("home-container");
const postList = document.getElementById("home-post-list");
const showNewPostsDiv = document.getElementById("home-show-new-posts-div");
const showNewPostsButton = document.getElementById(
  "home-show-new-posts-button"
);
let newPosts = [];
let ownPostIds = [];
const alreadyGoingErrorMessage = `<button class="already-going already-going-error-message">
Sorry, this post is already being responded to.<br />
Please select another one to start a conversation.</button>`;
let clickedPostId = -1;
const loaderElement = document.querySelector(".loader");
const loaderBar = `<div class="loader-bar-wrapper">
<div class="loader-bar"></div></div>`;
const notificationBadge = document.querySelector(".notification-badge");
const noPostsMessage = `<p id="home-no-posts-message">No Conversations Available At The Moment</p>`;
let alreadyInteractingPostIds = [];

const postActionHTML = `<p class="post-action"></p>`; // `<i class="fa fa-long-arrow-right"></i>`;
const postActionStart = "START";
const postActionGoTo = "🡒";
const postStatusHTML = `<p class="post-status"></p>`;
const postStatusAlreadyGoing = "already going";
const postStatusNoResponseYet = "no response yet";
const postStatusBeingRespondedTo = "being responded to";

const createElement = document.getElementById("index-create");
const createInputElement = document.getElementById("index-create-input");
createInputElement.addEventListener("click", onCreateInputElementClick);
function onCreateInputElementClick() {
  window.location.href = "/create";
}

let postsAreBeingLoaded = true;

//to calculate top tags
let activePosts = [];

function updatePostList() {
  postsAreBeingLoaded = true;
  showNewPostsButton.style.display = "none";
  showNewPostsButton.innerHTML = "";
  newPosts = [];
  postList.innerHTML = "";
  loaderElement.style.display = "block";
  showNewPostsDiv.style.display = "none";
  const param = tag ? "?tag=" + tag : q ? "?q=" + q : "";
  fetch(API_URL + "post/" + param, {
    method: "GET",
    credentials: "include",
  })
    .then((response) => {
      if (response.ok) return response.json();
      else alert("An error occured");
    })
    .then((data) => {
      activePosts = data;
      updateOwnPostIds();
    });
}

//fetch only ids instead
function updateOwnPostIds() {
  fetch(API_URL + "my_talks/", {
    method: "GET",
    credentials: "include",
  })
    .then((response) => {
      if (response.ok) return response.json();
      else alert("An error occured");
    })
    .then((data) => {
      for (let i = 0; i < data.length; ++i) ownPostIds.push(data[i]["id"]);
      loaderElement.style.display = "none";
      drawPosts(activePosts, false);
    });
}

function drawPosts(data, areNew) {
  if (data.length == 0) {
    createElement.insertAdjacentHTML("afterend", noPostsMessage);
  } else {
    const noPostsMessageElement = document.getElementById(
      "home-no-posts-message"
    );
    if (noPostsMessageElement) noPostsMessageElement.remove();
    for (let i = 0; i < data.length; ++i) {
      const postItem = `<div class="post" id=${
        "post-" + data[i]["id"]
      }><p class="post-title">${
        data[i]["title"]
      }</p><span class="post-timestamp">${timeSince(
        Date.parse(data[i]["timestamp"])
      )}</span></div>`;
      const insertPosition = areNew ? "afterbegin" : "beforeend";
      postList.insertAdjacentHTML(insertPosition, postItem);
      const postElement = document.getElementById("post-" + data[i]["id"]);

      // add status tag and action button
      postElement.insertAdjacentHTML("beforeend", postStatusHTML);
      const postStatusElement = postElement.querySelector(".post-status");

      postElement.insertAdjacentHTML("beforeend", postActionHTML);
      const postActionElement = postElement.querySelector(".post-action");
      postActionElement.addEventListener("click", onPostActionClick);

      if (areNew) {
        //all posts in new are from other users so no need to check on authorship
        postActionElement.classList.add("start");
        postActionElement.innerHTML = postActionStart;

        // post response event came before posts fetch finished
        if (alreadyInteractingPostIds.includes(data[i]["id"].toString())) {
          postStatusElement.innerHTML = postStatusAlreadyGoing;
          postStatusElement.classList.add("already-going");
          postActionElement.classList.add("disabled");
        }
      } else {
        const isAuthor = ownPostIds.includes(data[i]["id"]);
        if (isAuthor) {
          postStatusElement.classList.add("no-response-yet");
          postStatusElement.innerHTML = postStatusNoResponseYet;
          postActionElement.classList.add("go-to");
          postActionElement.innerHTML = postActionGoTo;
        } else {
          postActionElement.classList.add("start");
          postActionElement.innerHTML = postActionStart;
        }
      }
    }
  }
  postsAreBeingLoaded = false;
}

function onResponseSubmit(token) {
  const postElement = document.getElementById("post-" + clickedPostId);
  postElement.insertAdjacentHTML("afterbegin", loaderBar);
  const data = { post_id: clickedPostId, "g-recaptcha-response": token };
  fetch(API_URL + "respond/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
    credentials: "include",
  })
    .then((response) => {
      if (response.ok) {
        console.log("redirecting");
        window.location.href = "/my_conversations" + "?post=" + clickedPostId;
      } else {
        postElement.querySelector(".loader-bar-container").style.display =
          "none";
        showalreadyGoingErrorMessage(clickedPostId);
      }
    })
    .catch((error) => {
      postElement.querySelector(".loader-bar-container").style.display = "none";
      console.error("Error: ", error);
    });
}

window.onResponseSubmit = onResponseSubmit;

function onPostActionClick(event) {
  const postActionElement = event.target;
  const postElement = postActionElement.parentElement;
  const postId = postElement.id.substring(5);

  if (postActionElement.classList.contains("go-to"))
    //is author
    window.location.href = "/my_conversations" + "?post=" + postId;
  else if (postActionElement.classList.contains("disabled"))
    showalreadyGoingErrorMessage(postId);
  else {
    clickedPostId = postId;
    grecaptcha.execute();
  }
}

showNewPostsButton.addEventListener("click", function (event) {
  const selectedButton = event.target;
  selectedButton.style.display = "none";
  showNewPostsDiv.style.display = "none";
  drawPosts(newPosts, true);
  for (let i = 0; i < newPosts.length; ++i)
    if (!alreadyInteractingPostIds.includes(newPosts[i]["id"].toString()))
      activePosts.push(newPosts[i]);

  //drawTopTags();
  // This prevents the page from scrolling down to where it was previously.
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  /* This is needed if the user scrolls down during page load to 
  make sure the page is scrolled to the top once it's fully loaded.
  This has Cross-browser support.*/
  window.scrollTo(0, 0);
  newPosts = [];
});

function showalreadyGoingErrorMessage(postId) {
  const post = document.getElementById("post-" + postId);
  post.insertAdjacentHTML("beforebegin", alreadyGoingErrorMessage);
  const errorMessageElement = document.getElementsByClassName(
    "already-going-error-message"
  )[0];
  window.setTimeout(function () {
    errorMessageElement.remove();
  }, 11 * 1000);
}

function timeSince(date) {
  var seconds = Math.floor((new Date() - date) / 1000);

  if (seconds < 10) return "just now";

  var interval = Math.floor(seconds / 31536000);

  if (interval >= 1) {
    return interval + " year" + (interval > 1 ? "s" : "") + " ago";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) {
    return interval + " month" + (interval > 1 ? "s" : "") + " ago";
  }
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) {
    return interval + " day" + (interval > 1 ? "s" : "") + " ago";
  }
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) {
    return interval + " hour" + (interval > 1 ? "s" : "") + " ago";
  }
  interval = Math.floor(seconds / 60);
  if (interval >= 1) {
    return interval + " minute" + (interval > 1 ? "s" : "") + " ago";
  }
  return Math.floor(seconds) + " seconds ago";
}

updatePostList();

const serverLocation = new URL(API_URL);
const es = new ReconnectingEventSource(serverLocation.origin + "/events/");
/*
es.addEventListener(
  "new_message",
  function (e) {
    notficationBadge.style.visibility = "visible";
  },
  false
);*/

es.addEventListener(
  "stream-reset",
  function (e) {
    // ... client fell behind, reinitialize ...
  },
  false
);

es.addEventListener(
  "new_post",
  function (e) {
    const newPost = JSON.parse(e.data);
    let isRelevant = true;
    if (q) {
      if (
        !(
          newPost["title"].includes(q) ||
          newPost["body"].includes(q) ||
          newPost["tags"].includes(q)
        )
      )
        isRelevant = false;
    } else if (tag) {
      if (!newPost["tags"].includes(tag)) {
        isRelevant = false;
      }
    }
    if (isRelevant) {
      //not show if loading
      if (!newPosts.length && !postsAreBeingLoaded) {
        showNewPostsDiv.style.display = "block";
        showNewPostsButton.style.display = "block";
      }
      newPosts.unshift(newPost);
      showNewPostsButton.innerHTML =
        newPosts.length + "&nbspNEW POST" + (newPosts.length === 1 ? "" : "S");
    }
  },
  false
);

es.addEventListener(
  "response",
  function (e) {
    const postId = JSON.parse(e.data)["post_id"];
    //to not show [already talking] right before redirecting to chat
    if (postId != clickedPostId) {
      alreadyInteractingPostIds.push(postId);
      const postElement = document.getElementById("post-" + postId);
      if (postElement) {
        const postStatusElement = postElement.querySelector(".post-status");
        const postActionElement = postElement.querySelector(".post-action");
        const isAuthor = ownPostIds.includes(parseInt(postId));
        if (isAuthor) {
          postStatusElement.innerHTML = postStatusBeingRespondedTo;
          postStatusElement.classList.remove("no-response-yet");
          postStatusElement.classList.add("being-responded-to");
        } else {
          postStatusElement.innerHTML = postStatusAlreadyGoing;
          postStatusElement.classList.add("already-going");
          postActionElement.classList.add("disabled");
        }
        const postIndex = activePosts.findIndex((post) => post.id == postId);
        activePosts.splice(postIndex, 1);
        //drawTopTags();
      }
      //else - new post not opened yet
    }
  },
  false
);

//for header My Conversations button badge
fetch(API_URL + "talk_present/", {
  method: "GET",
  credentials: "include",
})
  .then((response) => response.json())
  .then((data) => {
    if (data["number"]) {
      fetch(API_URL + "not_seen_present/", {
        method: "GET",
        credentials: "include",
      })
        .then((response) => response.json())
        .then((data) => {
          if (data["number"]) notificationBadge.style.visibility = "visible";
        });
      const serverLocation = new URL(API_URL);
      const ws_scheme = serverLocation.protocol == "https:" ? "wss" : "ws";
      const ws_path = ws_scheme + "://" + serverLocation.host + "/ws";
      var socket = new ReconnectingWebSocket(ws_path);
      socket.onmessage = function (e) {
        data = JSON.parse(e.data);
        if (!data["is_author"]) notificationBadge.style.visibility = "visible";
      };
    }
  });
