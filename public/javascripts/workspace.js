// referenced from https://www.w3schools.com/howto/howto_js_todolist.asp


var addCloseTrigger = function(el) {
  el.addEventListener('click', function() {
    var div = this.parentElement;
    div.style.display = "none";

    // update database by sending POST request
    var description = div.textContent.slice(0, -1); // remove the close button from end
    var note = div.parentElement.parentElement.firstChild.textContent;
    var url = window.location.href;
    var group_id = url.substring(url.lastIndexOf('/') + 1);
    var data = {
      description : description,
      note : note,
      group_id : group_id
    };
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/deletenote', true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var res = JSON.parse(xhr.response);
        console.log(res);
      }
    };
    xhr.send(JSON.stringify(data));
  });
  return el;
}

var addCheckTrigger = function(el) {
  el.addEventListener('click', function(ev) {
    if (ev.target.tagName === 'LI') {
      ev.target.classList.toggle('checked');
    }
  }, false);
  return el;
}

// Create a "close" button and append it to each list item
var myNodelist = document.getElementsByTagName("LI");
var i;
for (i = 0; i < myNodelist.length; i++) {
  var span = document.createElement("SPAN");
  var txt = document.createTextNode("\u00D7");
  span.className = "close";
  span.appendChild(txt);
  myNodelist[i].appendChild(span);
}

// Click on a close button to hide the current list item
var close = document.getElementsByClassName("close");
var i;
for (i = 0; i < close.length; i++) {
  addCloseTrigger(close[i]);
}

// Add a "checked" symbol when clicking on a list item
var list = document.querySelector('ul');
addCheckTrigger(list);

function newBullet(text_box) {
  if (event.key === 'Enter' && text_box.value !== '') {
    var description = text_box.value;
    text_box.value = '';
    var new_bullet = document.createElement('LI');
    new_bullet.appendChild(document.createTextNode(description));
    var span = document.createElement("SPAN");
    var txt = document.createTextNode("\u00D7");
    span.className = "close";
    span.appendChild(txt);
    addCloseTrigger(span);
    new_bullet.appendChild(span);
    text_box.parentElement.children[1].appendChild(new_bullet);

    // update database by sending POST request
    var note = text_box.parentElement.firstChild.textContent;
    var url = window.location.href;
    var group_id = url.substring(url.lastIndexOf('/') + 1);
    var data = {
      description : description,
      note : note,
      group_id : group_id
    };
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/newnote', true);
    xhr.setRequestHeader("Content-Type", "application/json; charset=UTF-8");
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4 && xhr.status === 200) {
        var res = JSON.parse(xhr.response);
        console.log(res);
      }
    };
    xhr.send(JSON.stringify(data));
  }
}

function newNote(subject_box) {
  if (event.key === 'Enter' && subject_box.value !== '') {
    var note = document.createElement("DIV");
    note.className = 'note';
    var subject = document.createElement("H2");
    subject.innerHTML = subject_box.value;
    note.appendChild(subject);
    note.appendChild(addCheckTrigger(document.createElement('UL')));
    var input_box = document.createElement('INPUT');
    input_box.type = 'text';
    input_box.setAttribute('onkeydown', 'newBullet(this)');
    input_box.placeholder = 'New bullet';
    note.appendChild(input_box);
    document.body.insertBefore(note, subject_box);
    subject_box.value = '';
  }
}