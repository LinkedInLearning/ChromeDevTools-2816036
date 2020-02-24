var port = chrome.runtime.connect();

function renderComment(msg) {
  const renderDiv = document.createElement('div');
  renderDiv.className = "gloComment";
  renderDiv.style.position = 'absolute';
  renderDiv.style.width = "50px";
  renderDiv.style.height = "50px";
  renderDiv.style.top = msg.resp.comment.posY +"px";
  renderDiv.style.left = msg.resp.comment.posX +"px";
  renderDiv.style.zIndex = "20000";
  renderDiv.style.backgroundImage = "url(" + chrome.runtime.getURL('GloScreenTags48.png') + ")";
  renderDiv.setAttribute('data-modal', "closed")
  renderDiv.setAttribute('data-card', msg.resp.card.id);
  renderDiv.id = msg.resp.comment.commentId;
  renderDiv.name = msg.resp.card.name;
  renderDiv.draggable = true;
  const modalDiv = renderModalDiv(msg);
  modalDiv.className = "invisible";
  renderDiv.appendChild(modalDiv);
  renderDiv.addEventListener("dragend", dragEnd);
  if (msg.commentAlert) {
    const alertDiv = document.createElement('div');
    if (msg.commentAlert === "urgent") {
      alertDiv.textContent = "!";
      alertDiv.style = "background-color: red;position: absolute;color: white;width: 15px;height: 15px;line-height: 1em;text-align: center;border-radius: 100%;font-size: 14px;"
    }
    renderDiv.appendChild(alertDiv);
  }
  document.body.appendChild(renderDiv);
  renderDiv.addEventListener("click", function (e) {openModal(e)});
}

function openModal(e) {
  e.stopPropagation();
  const tagDiv = e.target;
  const chilDiv = tagDiv.childNodes[0];
  tagDiv.setAttribute("data-modal", "open");
  chilDiv.classList.remove("invisible");
  chilDiv.classList.add("visible");
  tagDiv.removeEventListener('click', openModal)
}

function dragEnd(e) {
  e.stopPropagation();
  const commentId = e.target.id;
  const cardId = e.target.getAttribute('data-card');
  const commentText = document.getElementById("input" + commentId).value;
  const posX = e.clientX - 25;
  const posY = e.clientY - 25;
  const text = 'gloCommentTag=' + window.location.href + '?posX=' + posX + '&posY=' + posY + ' gloCommentTagsText=' + commentText;
  // CHALLENGE 2C: Add a sendMessage call with subject: “saveComment” and the following resp
  // resp: {card: { cardId },comment:{commentId, posX, posY, commentText, text }}
  removeTag(commentId);
}

function saveComment (msg, e) {
  const commentInput = document.getElementById("input" + msg.resp.comment.commentId);
  e.stopPropagation();
  const posX = e.clientX - 25;
  const posY = e.clientY - 25;
  const text = 'gloCommentTag=' + window.location.href + '?posX=' + posX + '&posY=' + posY + ' gloCommentTagsText=' + commentInput.value;
  // CHALLENGE 2D: Add a sendMessage call with subject: “saveComment” and the following resp
  // resp: {card: msg.resp.card, comment:{ commentId: msg.resp.comment.commentId, posX, posY, commentText: commentInput.value, text}  }
}

function removeTag(commentId) {
  const gloComment = document.getElementById(commentId);
  gloComment.remove();
}

function closeModal(e) {
  e.stopPropagation();
  let element = e.target.parentNode.parentNode.parentNode;
  element.classList.remove("visible");
  element.classList.add("invisible");

  element.setAttribute("data-modal", "closed");
}

function sendMessage(msg) {  
  // CHALLENGE 2A: Create a sendMessage function similar to our send function in the panel
  // In this case we only need the simple one-time request: https://developer.chrome.com/extensions/messaging#simple

}

function renderCommentInput(commentText) {
  const commentInput = document.createElement('textarea');
  commentInput.rows = "3";
  if (commentText) {
    commentInput.value = commentText;
  }
  commentInput.className = "clearfix border";
  commentInput.addEventListener("click", (e) => e.stopPropagation())
  return commentInput
}

function renderCloseButton() {
  let closeBtn = document.createElement('button');
  closeBtn.className = "btn btn-light col pull-right"
  closeBtn.textContent = "x";
  closeBtn.addEventListener('click', closeModal);
  return closeBtn;
}

function renderHeaderDiv(cardName) {
  const cardNameDiv = document.createElement('p');
  cardNameDiv.style = "margin: 10px 0px;";
  cardNameDiv.textContent = cardName;
  return cardNameDiv;
}

function renderSaveButton(msg) {
  const saveBtn = document.createElement('button');
  saveBtn.textContent = "Save";
  saveBtn.className = "btn btn-link col float-right"
  saveBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    saveComment(msg, e);
    removeTag(msg.resp.comment.commentId)
  });
  return saveBtn;
}

function renderSaveEditDelete(msg) {
  const saveEditDelete = document.createElement('div');
  saveEditDelete.className = "row";

  const saveBtn = renderSaveButton(msg);
  saveEditDelete.appendChild(saveBtn);
  
  return saveEditDelete;
}

function renderModalBodyDiv(msg) {
  const modalBodyDiv = document.createElement('div');
  modalBodyDiv.style = "padding: 0px 15px 15px; border: thin solid #efefef; background-color: white "
  const commentInput = renderCommentInput(msg.resp.comment.commentText);
  commentInput.className = "border";
  commentInput.id = "input" + msg.resp.comment.commentId;
  const closeBtn = renderCloseButton();
  const headerDiv = renderHeaderDiv(msg.resp.card.name);
  headerDiv.appendChild(closeBtn);
  const saveEditDelete = renderSaveEditDelete(msg);
  modalBodyDiv.appendChild(headerDiv);
  modalBodyDiv.appendChild(commentInput);
  modalBodyDiv.appendChild(saveEditDelete);
  return modalBodyDiv
}

function renderModalDiv(msg) {
  let modalDiv = document.createElement('div');
  modalDiv.className = "commentCard";
  modalDiv.style = "position: absolute; top: 55px;";
  const modalBodyDiv = renderModalBodyDiv(msg);
  modalDiv.appendChild(modalBodyDiv);
  return modalDiv;
}