import { API_URL } from "./api.js";
let currentPost = {};
let posts = [];
const chatInput = document.getElementById("chat-input");
const chatButton = document.getElementById("btn-send");
const postList = document.getElementById("post-list");
const messageList = document.getElementById("messages");
const chatWindowStartMessage = document.getElementById(
  "chat-window-start-message"
);
const chatWindowNoResponseMessage = `<div id="chat-window-no-response-message"></br><p>Sorry, no response yet</p></div>`;
const chatWindowTitle = document.getElementById("chat-window-title");
let sentMessages = [];
let nNewMessages = {}; // related to post
const pageLoaderElement = document.getElementById("chat-loader");
const messagesLoaderElement = document.getElementById("chat-messages-loader");
const container = document.querySelector(".container");
const noTalksYetMessage = document.getElementById("chat-no-talks-yet");
const notificationBadge = document.querySelector(".notification-badge");

if (messagesScrollbarIsVisible()) messageList.classList.add("with-scrollbar");
else messageList.classList.remove("with-scrollbar");

//https://stackoverflow.com/questions/34558264/fetch-api-with-cookie

//to do: ?through ws
function updateUserList() {
  fetch(API_URL + "my_talks/", {
    method: "GET",
    credentials: "include",
  })
    .then((response) => {
      if (response.ok) return response.json();
      else alert("An error occured");
    })
    .then((data) => {
      pageLoaderElement.style.display = "none";
      if (data.length == 0) noTalksYetMessage.style.display = "block";
      else {
        container.style.display = "block";
        postList.innerHTML = "";
        posts = data;
        for (let post of posts) nNewMessages[post.id] = 0;

        for (let i = 0; i < data.length; ++i) {
          const postItem = `<a id=${
            data[i]["id"]
          } class="list-group-item chat-post"><span class="chat-post-title">${
            data[i]["title"]
          }</span><span class="n-new-messages" id=${
            "n-new-messages-" + data[i]["id"]
          }></span></a>`;
          postList.insertAdjacentHTML("beforeend", postItem);
        }

        // add click event to every post
        const postListChildren = postList.children;
        for (let postListChild of postListChildren) {
          postListChild.addEventListener("click", function () {
            const activePost = postList.querySelector(".active");
            if (activePost) activePost.classList.remove("active");
            postListChild.classList.add("active");

            setCurrentPost(postListChild.id);
            chatWindowStartMessage.style.display = "none";

            const activeBadge = postList.querySelector(".active-badge");
            if (activeBadge) activeBadge.classList.remove("active-badge");
            const postNNewMessages = document.getElementById(
              "n-new-messages-" + postListChild.id
            );

            postNNewMessages.classList.add("active-badge");

            // remove no response message for previous post if it's on screen
            const chatWindowNoResponseMessageElement = document.getElementById(
              "chat-window-no-response-message"
            );
            if (chatWindowNoResponseMessageElement)
              chatWindowNoResponseMessageElement.style.display = "none";

            messageList.innerHTML = "";

            messagesLoaderElement.style.display = "block";

            //set chat title
            const postIndex = posts.findIndex(
              (post) => post.id == postListChild.id
            );
            chatWindowTitle.innerHTML = posts[postIndex]["title"];

            sentMessages = [];
          });
        }
        //setCurrentPost(data[data.length - 1].id); - replaced with select chat message

        getNumbersOfNewMessages();

        //user clicked post on index page
        const urlParams = new URLSearchParams(window.location.search);
        const postId = urlParams.get("post");
        if (postId) {
          document.getElementById(postId.toString()).click();
          history.replaceState(null, "", "/my_conversations");
        }
      }
    });
}

function messagesScrollbarIsVisible() {
  return messageList.scrollHeight > messageList.clientHeight;
}

window.addEventListener("resize", onWindowResizeMessagesScrollbar);
function onWindowResizeMessagesScrollbar() {
  if (messagesScrollbarIsVisible()) messageList.classList.add("with-scrollbar");
  else messageList.classList.remove("with-scrollbar");
}

const isLinkRegex = /^(?!:\/\/)([a-zA-Z0-9]+\.)?[a-zA-Z0-9][a-zA-Z0-9-]+\.[a-zA-Z]{2,6}?$/g;

function isLinkOnly(text) {
  const matched = text.match(isLinkRegex);
  return matched != null;
}

function drawMessage(message) {
  let position = message.is_author ? "author" : "recipient";
  const date = new Date(message.timestamp);
  const dateAmPm = date.toLocaleString("en-US", {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  });

  let sentMessageIndex = -1;
  if (
    sentMessages.length > 0 &&
    message.body == sentMessages[sentMessages.length - 1]
  )
    sentMessageIndex = sentMessages.length - 1;

  const sentCheck = message.is_author
    ? sentMessageIndex != -1
      ? `<i id="message-received-indicator-${sentMessageIndex}" class="fa fa-check sent-check-not-displayed" aria-hidden="true"></i>`
      : `<i class="fa fa-check" aria-hidden="true"></i>`
    : "";
  const timePlusSentCheck = `<p class="time">${dateAmPm}${sentCheck}</p>`;
  const nAuthorMessages = document.getElementsByClassName("author").length;
  const nRecipientMessages = document.getElementsByClassName("recipient")
    .length;
  const sanitizedMessageText = isLinkOnly(message.body)
    ? nAuthorMessages >= 5 && nRecipientMessages >= 5
      ? message.body
      : "***"
    : message.body;
  const messageBody = `<p class="message-body"> ${sanitizedMessageText}</p>`;
  const messageContent = message.is_author
    ? timePlusSentCheck + messageBody
    : messageBody + timePlusSentCheck;
  const messageItem = `<li class="message ${position}">${messageContent}</li>`;
  messageList.insertAdjacentHTML("beforeend", messageItem);
  if (messagesScrollbarIsVisible()) messageList.classList.add("with-scrollbar");
  messageList.scrollTop = messageList.scrollHeight;
}

//to do: ?through ws
function getConversation(post) {
  fetch(API_URL + `message/?target=${post["id"]}`, {
    method: "GET",
    credentials: "include",
  })
    .then((response) => {
      if (response.ok) return response.json();
      else alert("An error occured");
    })
    .then((data) => {
      messagesLoaderElement.style.display = "none";

      messageList.insertAdjacentHTML("afterbegin", "<br/>");

      // show post title and body as initial messages
      const postTitleAsMessage = {
        body: currentPost.title,
        is_author: currentPost.is_author,
        timestamp: currentPost.timestamp,
      };
      drawMessage(postTitleAsMessage);
      if (currentPost.body) {
        const postBodyAsMessage = {
          body: currentPost.body,
          is_author: currentPost.is_author,
          timestamp: currentPost.timestamp,
        };
        drawMessage(postBodyAsMessage);
      }

      const isResponsePresent = data.length > 0;
      if (currentPost["is_author"] && !isResponsePresent) {
        disableInput();
        messageList.insertAdjacentHTML(
          "beforeend",
          chatWindowNoResponseMessage
        );
      } else {
        for (let i = data.length - 1; i >= 0; i--) {
          drawMessage(data[i]);
        }
        messageList.animate({ scrollTop: messageList.scrollHeight });
        enableInput();

        // remove post's number of new messages badge
        nNewMessages[currentPost["id"]] = 0;
        const nNewMessagesForPostElement = document.getElementById(
          "n-new-messages-" + currentPost["id"]
        );
        nNewMessagesForPostElement.innerHTML = "";

        // if no not seen messages through all posts remove [my talks] new messages badge
        let noNewMessages = true;
        for (let postId in nNewMessages) {
          if (nNewMessages[postId]) noNewMessages = false;
        }

        if (noNewMessages) notificationBadge.style.visibility = "hidden";
      }
    });
}

//to do: ?through ws
function getNumbersOfNewMessages() {
  fetch(API_URL + "number_of_not_seen_messages/", {
    method: "GET",
    credentials: "include",
  })
    .then((response) => {
      if (response.ok) return response.json();
      else alert("An error occured");
    })
    .then((data) => {
      for (let row of data) {
        const postId = row[0];

        const nNewMessagesForPost = row[1];

        nNewMessages[postId] = nNewMessagesForPost;
        const nNewMessagesForPostElement = document.getElementById(
          "n-new-messages-" + postId
        );
        nNewMessagesForPostElement.innerHTML = nNewMessagesForPost;
      }

      // if not seen messages present make header badge visible
      let notSeenMessagesPresent = false;
      for (let postId in nNewMessages) {
        if (nNewMessages[postId]) notSeenMessagesPresent = true;
      }

      if (notSeenMessagesPresent)
        notificationBadge.style.visibility = "visible";
    });
}

function sendMessage(post, body) {
  sentMessages.push(body);
  let message = { body: body, is_author: true, timestamp: Date.now() };
  drawMessage(message);
  const data = { type: "save", body: body, post_id: post["id"] };
  socket.send(JSON.stringify(data));
}

function setCurrentPost(id) {
  for (let i = 0; i < posts.length; ++i)
    if (id == posts[i]["id"]) {
      currentPost = posts[i];
    }
  getConversation(currentPost);
}

function enableInput() {
  chatInput.disabled = false;
  chatButton.disabled = false;
  chatInput.focus();
}

function disableInput() {
  chatInput.disabled = true;
  chatButton.disabled = true;
}

disableInput();

updateUserList();

const serverLocation = new URL(API_URL);
const ws_scheme = serverLocation.protocol == "https:" ? "wss" : "ws";
const ws_path = ws_scheme + "://" + serverLocation.host + "/ws";
var socket = new ReconnectingWebSocket(ws_path);

chatInput.onkeypress = onChatInputKeyPress;

function onChatInputKeyPress(e) {
  if (e.keyCode == 13) chatButton.click();
}

chatButton.addEventListener("click", function () {
  if (chatInput.value.length > 0) {
    sendMessage(currentPost, chatInput.value);
    chatInput.value = "";
  }
});

socket.onmessage = function (e) {
  const data = JSON.parse(e.data);
  if (data["post_id"] === currentPost["id"]) {
    if (data["is_author"]) {
      const messageIndex = sentMessages.indexOf(data["body"]);
      const messageReceivedIndicator = document.getElementById(
        "message-received-indicator-" + messageIndex
      );
      messageReceivedIndicator.classList.remove("sent-check-not-displayed");
    } else {
      const chatWindowNoResponseMessage = document.getElementById(
        "chat-window-no-response-message"
      );
      if (chatWindowNoResponseMessage)
        if ((chatWindowNoResponseMessage.style.display = "block")) {
          chatWindowNoResponseMessage.style.display = "none";

          enableInput();
        }
      drawMessage(data);
      const seen_data = { type: "seen", message_id: data["id"] };
      socket.send(JSON.stringify(seen_data));
    }
  } else {
    if (!data["is_author"]) {
      //declared in header
      notificationBadge.style.visibility = "visible";
      ++nNewMessages[data["post_id"]];
      const nNewMessagesForPostElement = document.getElementById(
        "n-new-messages-" + data["post_id"]
      );
      nNewMessagesForPostElement.innerHTML = nNewMessages[data["post_id"]];
    }
  }
  //messageList.animate({ scrollTop: messageList.scrollHeight });
};
