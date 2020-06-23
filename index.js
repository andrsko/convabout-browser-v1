import { API_URL } from "./api.js";

let tag = "";
let q = "";
const parser = document.createElement("a");
parser.href = window.location.href;
if (parser.pathname.substring(0, 5) === "/tag/") {
  tag = parser.pathname.substring(5);
} else if (parser.pathname === "/search") {
  q = new URL(window.location.href).searchParams.get("q");
}
const homeContainer = document.getElementById("home-container");
const homeTopTags = document.getElementById("home-top-tags");
const postList = document.getElementById("home-post-list");
const showNewPostsDiv = document.getElementById("home-show-new-posts-div");
const showNewPostsButton = document.getElementById(
  "home-show-new-posts-button"
);
let newPosts = [];
const alreadyTalkingTag = `<button class="post-tag already-talking">already interacting</button>`;
const alreadyTalkingErrorMessage = `<button class="post-tag already-talking already-talking-error-message">
Sorry, this post is already being responded to.<br />
Please select another one to start talking.</button>`;
let clickedPostId = -1;
const loaderElement = document.querySelector(".loader");
const loaderBar = `<div class="loader-bar-container"><div class="loader-bar-wrapper">
<div class="loader-bar"></div></div>
</div>`;
const notificationBadge = document.querySelector(".notification-badge");
const noPostsMessage = `<p id="home-no-posts-message">No Conversations Available At The Moment</p>`;
const recaptchaContainer = ``;
let alreadyInteractingPostIds = [];

//to calculate top tags
let activePosts = [];

let activeTag = "";
const NUMBER_OF_TOP_TAGS = 10;

function drawTopTags() {
  let tagCounts = {};
  for (let post of activePosts)
    if (post["tags"]) {
      for (let tag of post["tags"].split(","))
        if (tag.trim() in tagCounts) ++tagCounts[tag.trim()];
        else tagCounts[tag.trim()] = 1;
    }
  const topTags = Object.keys(tagCounts)
    .sort(function (a, b) {
      return tagCounts[b] - tagCounts[a];
    })
    .slice(0, NUMBER_OF_TOP_TAGS);
  const topTagsHtml = topTags.map(
    (tag) =>
      `<button class="post-tag top-tag ${
        tag == activeTag ? "active" : ""
      }">${tag}</button>`
  );
  homeTopTags.innerHTML = topTagsHtml.join("");
  const homeTopTagElements = homeTopTags.querySelectorAll(".top-tag");
  for (let homeTopTagElement of homeTopTagElements)
    homeTopTagElement.addEventListener("click", onTagClick);
}

function updatePostList() {
  showNewPostsButton.style.display = "none";
  newPosts = [];
  showNewPostsButton.innerHTML = "";
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
      loaderElement.style.display = "none";
      activePosts = data;
      drawTopTags();
      drawPosts(data, false);
      showNewPostsDiv.style.display = "block";
    });
}

function drawPosts(data, areNew) {
  if (data.length == 0) {
    homeContainer.insertAdjacentHTML("afterbegin", noPostsMessage);
  } else {
    const noPostsMessageElement = document.getElementById(
      "home-no-posts-message"
    );
    if (noPostsMessageElement) noPostsMessageElement.remove();
    for (let i = data.length - 1; i >= 0; --i) {
      const postTags = data[i]["tags"]
        ? data[i]["tags"]
            .split(",")
            .map((tag) => `<button class="post-tag">${tag.trim()}</button>`)
        : [];
      const postItem = `<div class="post" id=${"post-" + data[i]["id"]}>
                        <p class="post-title">${data[i]["title"]}</p>
                        ${postTags.join("")}
                        <p class="post-body post-body-collapsed">
                          <span class="post-timestamp"> 
                            ${timeSince(Date.parse(data[i]["timestamp"]))} ago
                          </span>
                           ${data[i]["body"] ? " · " + data[i]["body"] : ""}
                        </p>
                      </div>`;
      const insertPosition = areNew ? "afterbegin" : "beforeend";
      postList.insertAdjacentHTML(insertPosition, postItem);
      const postElement = document.getElementById("post-" + data[i]["id"]);
      const postTitle = postElement.querySelector(".post-title");
      postTitle.addEventListener("click", onTitleClick);
      const postTagElements = postElement.querySelectorAll(".post-tag");
      for (let postTagElement of postTagElements)
        postTagElement.addEventListener("click", onTagClick);

      if (
        areNew &&
        alreadyInteractingPostIds.includes(data[i]["id"].toString())
      )
        postTitle.insertAdjacentHTML("afterend", alreadyTalkingTag);

      const postBody = postElement.querySelector(".post-body");
      if (isEllipsisActive(postBody)) {
        const expandButton = `<button class="post-expand-button">EXPAND...</button>`;
        postElement.insertAdjacentHTML("beforeend", expandButton);
        const expandButtonElement = postElement.querySelector(
          ".post-expand-button"
        );
        expandButtonElement.addEventListener("click", onExpandCollapseClick);
      }
    }
  }
}

function isEllipsisActive(e) {
  return e.offsetHeight < e.scrollHeight;
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
        showAlreadyTalkingErrorMessage(clickedPostId);
      }
    })
    .catch((error) => {
      postElement.querySelector(".loader-bar-container").style.display = "none";
      console.error("Error: ", error);
    });
}

window.onResponseSubmit = onResponseSubmit;

function onTitleClick(event) {
  const postTitleElement = event.target;
  const postElement = postTitleElement.parentElement;
  const postId = postElement.id.substring(5);
  clickedPostId = postId;
  grecaptcha.execute();
}

function onTagClick(event) {
  const selectedButton = event.target;
  tag = selectedButton.innerHTML;
  activeTag = tag;
  q = "";
  history.replaceState(null, "", "/tag/" + tag + "/");
  //history.pushState({}, "", "tag/" + tag.toString());
  updatePostList();
}

showNewPostsButton.addEventListener("click", function (event) {
  const selectedButton = event.target;
  selectedButton.style.display = "none";
  drawPosts(newPosts, true);

  for (let i = 0; i < newPosts.length; ++i)
    if (!alreadyInteractingPostIds.includes(newPosts[i]["id"].toString()))
      activePosts.push(newPosts[i]);

  drawTopTags();
  // This prevents the page from scrolling down to where it was previously.
  if ("scrollRestoration" in history) {
    history.scrollRestoration = "manual";
  }
  /* This is needed if the user scrolls down during page load and you want to 
  make sure the page is scrolled to the top once it's fully loaded.
  This has Cross-browser support.*/
  window.scrollTo(0, 0);
  newPosts = [];
});

function onExpandCollapseClick() {
  const selectedButton = event.target;
  selectedButton.innerHTML =
    selectedButton.innerHTML == "EXPAND..." ? "COLLAPSE" : "EXPAND...";
  const parentDiv = selectedButton.parentElement;
  const postBody = parentDiv.querySelector(".post-body");
  postBody.classList.toggle("post-body-collapsed");
}

function showAlreadyTalkingErrorMessage(postId) {
  const post = document.getElementById("post-" + postId);
  post.insertAdjacentHTML("afterbegin", alreadyTalkingErrorMessage);
  const errorMessageElement = post.children[0];
  window.setTimeout(function () {
    errorMessageElement.remove();
  }, 7 * 1000);
}

function timeSince(date) {
  var seconds = Math.floor((new Date() - date) / 1000);

  var interval = Math.floor(seconds / 31536000);

  if (interval > 1) {
    return interval + " years";
  }
  interval = Math.floor(seconds / 2592000);
  if (interval > 1) {
    return interval + " months";
  }
  interval = Math.floor(seconds / 86400);
  if (interval > 1) {
    return interval + " days";
  }
  interval = Math.floor(seconds / 3600);
  if (interval > 1) {
    return interval + " hours";
  }
  interval = Math.floor(seconds / 60);
  if (interval > 1) {
    return interval + " minutes";
  }
  return Math.floor(seconds) + " seconds";
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
      if (!newPosts.length) {
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
        const postTitleElement = postElement.querySelector(".post-title");
        postTitleElement.insertAdjacentHTML("afterend", alreadyTalkingTag);
        const postIndex = activePosts.findIndex((post) => post.id == postId);
        activePosts.splice(postIndex, 1);
        drawTopTags();
      }
      //else - new post not opened yet
    }
  },
  false
);

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
