// here we are injecting the content script so that we don't have to add it to the manifest and make it available to all urls
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  chrome.tabs.executeScript(tabs[0].id, {file: "content.js"});
});

// with onConnect there has to be a corresponding connect event which you will find in the content script
// usign the onConnect method creates a long-lived connection https://developer.chrome.com/extensions/messaging
chrome.runtime.onConnect.addListener((port) => {
  // adding event Listeners to UI
  const connectBtn = document.getElementById("connectBtn");
  connectBtn.addEventListener("click", (e) => storePAT(e, patInput.value));
  const disconnectBtn = document.getElementById("disconnectBtn");
  disconnectBtn.addEventListener("click", removePAT);
  const boardSelect = document.getElementById("board_select");
  const contentCont = document.getElementById('board_content');

  // check to see if there is a Glo Screen Comment Personal Authorization Token already saved
  chrome.storage.local.get("gscPAT", (results) => {
    // if it does NOT exist, open the gitkracken PAT page
    // PAT URL page: https://app.gitkraken.com/pats/new?name=GloScreenComments&scope=board:write
    // here we are pasing the name and the scope as parameters of the URL so that they automatically populate on the opening page
    // a ? starts the parameters in a URL and the & separates multiple parameters
    if(!results.gscPAT) {
      // Open the gitkraken app with scope and name fields filled in     
      chrome.windows.create({url: "https://app.gitkraken.com/pats/new?name=GloScreenComments&scope=board:write"})
    } else {
      patToInput(results.gscPAT);
      // Access the boards
      // variables to concatenate urls (see: https://gloapi.gitkraken.com/v1/docs/ for more information) 
      const baseUrl = 'https://gloapi.gitkraken.com/v1/glo/';
      const accessToken = '?access_token' + results.gscPAT;
      getData(baseUrl + 'boards/' + accessToken)
        .then((data) => {
          renderBoardDropDown(data, boardSelect);
          listenToBoardSelect(baseUrl, accessToken);
        });
    }
  })

  function storePAT(e, v) {
    // here you can use an ES6 fat arrow function as a callback
    // () => {} is short hand for function() {}
    chrome.storage.local.set({"gscPAT": v})
  }

  function removePAT() {
    chrome.storage.local.remove("gscPAT");
  }

  function sendMessage(msg) {
    port.postMessage(msg)
  }
  sendMessage({subject: "renderComment", message: "Test"})
  function listenToBoardSelect(baseUrl, accessToken) {
    const boardSelect = document.getElementById('board_select');
    const contentCont = document.getElementById('board_content');
    boardSelect.addEventListener('change', (e) => {
      const boardId = e.target.value;
      listenForMessages(baseUrl, boardId, accessToken);
      getData(baseUrl + 'boards/' + boardId + accessToken + '&fields=columns')
        .then((data) => {
          contentCont.innerHTML = '';
          const columns = data.columns;
          columns.forEach((column) => {
            // CHALLENGE 3A THEN loop through the columns and use getData to get the cards using the columnId (for help check API documentation: https://gloapi.gitkraken.com/v1/docs/)
    
            // CHALLENGE 3B THEN loop through the cards and use getData to get the comments
            // then forEach comment pass the card and the comment to the addTagToContent function
          })
        })
      
    });

    

  }

  function listenForMessages(baseUrl, boardId, accessToken) {
    // CHALLENGE 2B: Add Listener to chrome.onMessage and do an IF statements checking to see if the subject is saveComment
    chrome.runtime.onMessage.addListener((msg) => {
      if(msg.subject === "saveComment") {
        
      }
    })
      return
  }

  function addTagToContent(card, comment) {
    if(comment && comment.text) {
      const parsedComment = parseGloCommentTag(comment.text);
      //  using ES6 destructuring to break out variables
      var { url, posX, posY, commentText, commentAlert } = parsedComment;
      if(parsedComment) {
        // CHALLENGE 2E: Add a sendMessage call with subject: “renderComment” and the following resp
        // resp: {card, comment: {commentId: comment.id, url, posX, posY, commentText, commentAlert}}
        sendMessage({subject: "renderComment", resp: {card, comment: {commentId: comment.id, url, posX, posY, commentText, commentAlert}}})
      }
    } else {
      // CHALLENGE 2E: Add a sendMessage call with subject: “renderComment” and the following resp
      
      // CHALLENGE 4A: Add a postData function that creates a new comment
      // Note: you'll need the baseURL, boardId and accessToken
      // THEN pass in the commentID that comes back from the post to the resp.comment.commentId
      
      sendMessage({subject: "renderComment", resp: {card, comment: {posX: "10", posY: "10", commentText: {text: ""}}}})
    }
  }

  function renderAddCommentButton(card, baseUrl, accessToken, boardId) {
    const addCommentBtn = document.createElement('button');
    addCommentBtn.className = "btn btn-link float-right pt-0 pb-0"
    addCommentBtn.innerHTML = "+";
    addCommentBtn.addEventListener('click', (e) => addTagToContent(card, null, baseUrl, accessToken, boardId))
    return addCommentBtn;
  }

  function renderTasksCard(card, baseUrl, accessToken, boardId) {
    const addCommentBtn = renderAddCommentButton(card, baseUrl, accessToken, boardId);
    const cardDiv = document.createElement('div');
    cardDiv.className = "border row p-3";
    const nameCont = renderCardName(card);
    cardDiv.appendChild(nameCont);
    cardDiv.appendChild(addCommentBtn);
    return cardDiv;
  }

  function renderCardName(card) {
    const nameCont = document.createElement('div');
    nameCont.className = "float-left"
    nameCont.innerHTML = card.name;
    return nameCont;
  }

  function renderBoardDropDown(data, boardSelect) {
    data.forEach((opt, i) => {
      boardSelect.options[i] = new Option(opt.name, opt.id);
    });
  }

  function renderColumn(column) {
    const colDiv = document.createElement('div');
    colDiv.className = "col";
    const colNameDiv = document.createElement('div');
    colNameDiv.innerHTML = column.name;
    colDiv.appendChild(colNameDiv);
    return colDiv;
  }

  function patToInput(pat) {
    const patInput = document.getElementById("patInput");
    patInput.value = pat;
  }

  function getUrlVars(url_string, v) {
      var url = new URL(url_string);
      var code = url.searchParams.get(v);
      return code;
  }

  function isValidUrl(string) {
    try {
      // if you try to create a new URL that does not have the properly formatted string, it will return an error
      new URL(string);
      return true;
    } catch (_) {
      return false;  
    }
  }

  function postData(url, data) {
    // when posting you have to turn the JSON object into a string so that the recieving end can read it 
    return fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })
    .then((response) => {
      // when you get back the response it's a string and you have to turn it back into JSON so that the script can read it
      return response.json();
    })
    .catch((error) => {
      throw error
    });
  }

  function getData(url) {
    return fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      // when you get back the response it's a string and you have to turn it back into JSON so that the script can read it
      return response.json();
    })
    .catch((error) => {
      throw error
    });
  }

  function parseGloCommentTag(comment) {
    
    if (comment.substring(0, 14) === 'gloCommentTag=') {
      // gloCommentTag=https://dog.ceo/dog-api/documentation/?posX=566&posY=57&gloCommentTagText=this is a comment&gloCommentTagAlert=urgent
      const commentSplit = comment.split("gloCommentTagText=");
      // 0: gloCommentTag=https://dog.ceo/dog-api/documentation/?posX=566&posY=57 
      // 1: gloCommentTagText=this is a comment&gloCommentTagAlert=urgent

      let commentSplit2, commentAlert;
      if (commentSplit[1]) {
        commentSplit2 = commentSplit[1].split('gloCommentTagAlert=')
      // 0: gloCommentTagText=this is a comment
      // 1: gloCommentTagAlert=urgent

      }
      const commentUrl = commentSplit[0].substring(14, commentSplit[0].length);
      // https://dog.ceo/dog-api/documentation/?posX=566&posY=57 
      let commentText = "insert comment";
      if (commentSplit2 && commentSplit2[0]) {
        commentText = commentSplit2[0];
        // this is a comment
      }
      if (commentSplit2 && commentSplit2[1]) {
        commentAlert = commentSplit2[1]
        // urgent
      }
      if (isValidUrl(commentUrl)) {
        // split out the url without the parameters
        const url = commentUrl.split('?')[0];
        // https://dog.ceo/dog-api/documentation/
        // pull out posX and posY and assignb them to variables of the same name
        
        let posX = getUrlVars(commentUrl, 'posX');
        // 566
        let posY = getUrlVars(commentUrl, 'posY');
        // 57
        // check if posX or posY exist and if they don't, assign them to 10
        if(!posX || !posY) {
          posX = 10;
          posY = 10;
        }

        // return an object using ES6 property shorthand
        // http://es6-features.org/#PropertyShorthand
        return { url, posX, posY, commentText, commentAlert }
      }
      return ;     
    }
    return;
  }

});
