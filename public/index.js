let $ = document.getElementById.bind(document);
let addThread = $('add-thread');
let addComment = $('add-comment');
let deleteThread = $('delete-thread');
let reportThread = $('report-thread');
let deleteReply = document.querySelectorAll('.delete-reply');
let reportReply = document.querySelectorAll('.report-reply');
let modalThreadButtons = document.querySelectorAll('[data-modal]');

//  Helpers
function modalCloser() {
  $('modal').style.top = '-100%';
  $('modal').style.display = 'none';
}

function alert(msg) {
  $('alert').style.display = 'block';
  return ($('alert-msg').textContent = msg);
}

function idGenerator() {
  let str = window.location.href.split('/');
  let id = str[str.length - 1] ? str[str.length - 1] : str[str.length - 2];
  return id;
}

// ADD A THREAD
if (addThread) {
  addThread.addEventListener('submit', e => {
    e.preventDefault();

    let board = $('thread-title').value;
    let text = $('thread-text').value;
    let password = $('thread-password').value;
    if (!board || !text || !password) {
      return alert('please enter all details');
    }
    if (board.length < 3) {
      return alert('The board_name should range between 3 - 10 characters.');
    }
    fetch('/api/threads', {
      method: 'POST',
      body: JSON.stringify({
        board,
        text,
        password
      }),
      headers: { 'Content-Type': 'application/json' }
    })
      .then(res => res.json())
      .then(data => {
        console.log('here');
        window.location = `/boards/${board}/`;
      });
  });
}

// POST A COMMENT
if (addComment) {
  addComment.addEventListener('submit', e => {
    e.preventDefault();
    let text = $('reply').value;
    let password = $('reply-password').value;
    let id = idGenerator();
    if (!text) {
      return alert('Please add a reply');
    }
    if (password.length < 4) {
      return alert('The password should range between 4 - 10 characters.');
    }
    fetch('/api/replies', {
      method: 'POST',
      body: JSON.stringify({ text, password, id }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.msg == 'success') {
          return window.location.reload();
        }
        return alert('Something went wrong. Try Again');
      });
  });
}

// DELETE THREAD
if (deleteThread) {
  deleteThread.addEventListener('click', () => {
    $('modal').style.display = 'block';
    $('modal').style.top = '0';
  });
}

// REPORT THREAD
if (reportThread) {
  reportThread.addEventListener('click', () => {
    let id = idGenerator();
    fetch('/api/threads', {
      method: 'PUT',
      body: JSON.stringify({ id }),
      headers: {
        'Content-Type': 'application/json'
      }
    })
      .then(res => res.json())
      .then(data => {
        if (data.msg) {
          return alert('Thread has been reported');
        }
        alert('Something went wrong.Try Again');
      });
  });
}

// DELETE COMMENT
if (deleteReply) {
  for (let reply of deleteReply) {
    reply.addEventListener('click', function() {
      let threadId = idGenerator();
      console.log(threadId, 'threadId');
      let replyId = this.getAttribute('data-id');
      let password = prompt('Deletion Password:');
      fetch('/api/replies', {
        method: 'DELETE',
        body: JSON.stringify({ password, replyId, threadId }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.msg) {
            return window.location.reload();
          }
          return alert('The password you entered is incorrect');
        });
    });
  }
}

// REPORT COMMENT
if (reportReply) {
  for (let reply of reportReply) {
    reply.addEventListener('click', function() {
      let id = this.getAttribute('data-id');
      fetch('/api/replies', {
        method: 'PUT',
        body: JSON.stringify({ id }),
        headers: {
          'Content-Type': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.msg) {
            return alert('Reply has been reported');
          }
          alert('Something went wrong.Try Again');
        });
    });
  }
}

// ALERT CLOSE BUTTON
$('close-btn').addEventListener('click', () => {
  $('alert').style.display = 'none';
});

//MODAL CLOSE
if ($('modal-close')) {
  $('modal-close').addEventListener('click', () => {
    modalCloser();
  });
}

// DELETE THREAD MODAL BUTTONS
if (modalThreadButtons) {
  modalThreadButtons.forEach(modalButton => {
    modalButton.addEventListener('click', function() {
      let modalValue = JSON.parse(this.getAttribute('data-modal'));
      let password = $('deletion-password').value;
      if (modalValue && !password) {
        alert('Please enter a password');
        return modalCloser();
      }
      if (!modalValue) {
        return modalCloser();
      } else {
        let id = idGenerator();
        fetch('/api/threads', {
          method: 'DELETE',
          body: JSON.stringify({ id, password }),
          headers: {
            'Content-Type': 'application/json'
          }
        })
          .then(res => res.json())
          .then(data => {
            if (data.msg) {
              return window.location.reload();
            } else {
              modalCloser();
              alert('The password you entered is incorrect');
            }
          });
      }
    });
  });
}
