var upload_modal = document.getElementById("uploadModal");
var upload_btn = document.getElementById("uploadBtn");
var upload_span = document.getElementsByClassName("close")[0];
upload_btn.onclick = function() {
    upload_modal.style.display = "block";
}
upload_span.onclick = function() {
    upload_modal.style.display = "none";
}
window.onclick = function(event) {
    if (event.target == upload_modal) {
        upload_modal.style.display = "none";
    }
}

var createFolder_modal = document.getElementById("createFolderModal");
var createFolder_btn = document.getElementById("createFolderBtn");
var createFolder_span = document.getElementsByClassName("close")[1];
createFolder_btn.onclick = function() {
    createFolder_modal.style.display = "block";
}
createFolder_span.onclick = function() {
    createFolder_modal.style.display = "none";
}
window.onclick = function(event) {
    if (event.target == createFolder_modal) {
        createFolder_modal.style.display = "none";
    }
}

document.getElementById('uploadForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const files = document.getElementById('file').files;
    const password = document.getElementById('upload_password').value;
    const currentPath = document.getElementById('upload_currentPath').value;
    const progressBarContainer = document.getElementById('progressBar');
    
    if (files.length === 0) {
        alert('No files selected!');
        return;
    }

    progressBarContainer.innerHTML = '';

    let results = [];

    for (let i = 0; i < files.length; i++) {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('password', password);
        formData.append('currentPath', currentPath);
        formData.append('files', files[i]);

        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar';
        progressBar.id = 'progress_bar_' + i;

        const progressFill = document.createElement('div');
        progressFill.className = 'progress-bar-fill';
        progressFill.id = 'progress_fill_' + i;
        progressFill.textContent = '0%';

        const uploading_file_name = document.createElement('p');
        uploading_file_name.id = files[i].name;
        uploading_file_name.textContent = files[i].name;

        progressBar.appendChild(progressFill);
        progressBarContainer.appendChild(uploading_file_name);
        progressBarContainer.appendChild(progressBar);

        xhr.open('POST', this.action, true);

        xhr.upload.onprogress = function(event) {
            if (event.lengthComputable) {
                const percentComplete = (event.loaded / event.total) * 100;
                progressFill.style.width = percentComplete + '%';
                progressFill.textContent = Math.round(percentComplete) + '%';
            }
        };

        xhr.onload = function() {
            if (xhr.status === 200) {
                results.unshift(files[i].name + " uploaded successfully");
            } else {
                results.push(files[i].name + " upload failed: " + xhr.statusText);
            }

            if (results.length === files.length) {
                alert(results.join("\n"));
                window.location.reload();
            }
        };

        xhr.onerror = function() {
            results.push(files[i].name + " upload failed: Network error");

            if (results.length === files.length) {
                alert(results.join("\n"));
                window.location.reload();
            }
        };

        xhr.send(formData);
    }
});

function hasReservedChars(reservedChars, folderName) {
    for (let i = 0; i < folderName.length; i++) {
        if (reservedChars.includes(folderName[i])) {
            return true;
        }
    }
    return false;
}
function hasReservedNames(reservedNames, folderName) {
    for (let i=0; i<reservedNames.length; i++){
        if (folderName.includes(reservedNames[i])){
            return true;
        }
    }
    return false;
}
document.getElementById('createFolderForm').addEventListener('submit', function(event) {
    event.preventDefault();
    const reservedChars = '<>:."\\|?*\x00-\x1F';
    const reservedNames = [
        "CON", "PRN", "AUX", "NUL", 
        "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
        "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
    ];
    const folderName = document.getElementById('folderName').value;
    const password = document.getElementById('createfolder_password').value;
    const currentPath = document.getElementById('createfolder_currentPath').value;

    if (hasReservedChars(reservedChars, folderName) || hasReservedNames(reservedNames, folderName)) {
        alert("Folder containes reserved characters or names!!");
    }else{
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('password', password);
        formData.append('currentPath', currentPath);
        formData.append('folder', folderName);
        xhr.open('POST', this.action, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4 && xhr.status === 200) {
                window.location.reload();
            } else if (xhr.readyState === 4) {
                alert("Falied to create folder!!");
                window.location.reload();
            }
        };
        xhr.send(formData);
    }
});

document.getElementById("search").addEventListener('click', function(){
    var userInput = document.getElementById("search_name").value.toLowerCase();
    const gridContainer = document.getElementById('grid-container');
    const fileitemsArray = Array.from(gridContainer.getElementsByClassName('grid-item-file'));
    const folderitemsArray = Array.from(gridContainer.getElementsByClassName('grid-item-folder'));
    var display_items = [];
    fileitemsArray.forEach((item) => {
        if(item.querySelector('p').textContent.trim().toLowerCase().includes(userInput)){
            display_items.push(item);
        }
    });
    folderitemsArray.forEach((item) => {
        if(item.querySelector('p').textContent.trim().toLowerCase().includes(userInput)){
            display_items.push(item);
        }
    });

    while (gridContainer.firstChild) {
        gridContainer.removeChild(gridContainer.firstChild);
    }
    display_items.forEach(item => gridContainer.appendChild(item));
});

document.getElementById('sortDropdown').addEventListener('change', function() {
    sortGridItems(this.value);
});

function sortGridItems(order) {
    const gridContainer = document.getElementById('grid-container');
    const fileitemsArray = Array.from(gridContainer.getElementsByClassName('grid-item-file'));
    const folderitemsArray = Array.from(gridContainer.getElementsByClassName('grid-item-folder'));
    
    fileitemsArray.sort((a, b) => {
        const nameA = a.querySelector('p').textContent.trim().toLowerCase();
        const nameB = b.querySelector('p').textContent.trim().toLowerCase();
        if (order === 'desc') {
            return nameB.localeCompare(nameA);
        } else {
            return nameA.localeCompare(nameB);
        }
    });
    folderitemsArray.sort((a, b) => {
        const nameA = a.querySelector('p').textContent.trim().toLowerCase();
        const nameB = b.querySelector('p').textContent.trim().toLowerCase();
        if (order === 'desc') {
            return nameB.localeCompare(nameA);
        } else {
            return nameA.localeCompare(nameB);
        }
    });
    if(order=='asc'){
        while (gridContainer.firstChild) {
            gridContainer.removeChild(gridContainer.firstChild);
        }
        folderitemsArray.forEach(item => gridContainer.appendChild(item));
        fileitemsArray.forEach(item => gridContainer.appendChild(item));

    }
    else{
        while (gridContainer.firstChild) {
            gridContainer.removeChild(gridContainer.firstChild);
        }
        folderitemsArray.forEach(item => gridContainer.appendChild(item));
        fileitemsArray.forEach(item => gridContainer.appendChild(item));
    }
}

document.addEventListener('DOMContentLoaded', function() {
    var sessionCode = sessionStorage.getItem('session_code');
    var deleteButtons = document.querySelectorAll('.delete');
    
    if (sessionCode) {
        deleteButtons.forEach(function(button) {
        button.style.display = 'inline-block';
        });
    } else {
        deleteButtons.forEach(function(button) {
        button.style.display = 'none';
        });
    }

    const toggleButton = document.getElementById('darkModeToggle');
    const body = document.body;

    toggleButton.addEventListener('click', function() {
        if (body.classList.contains('light-mode')) {
            body.classList.remove('light-mode');
            body.classList.add('dark-mode');
        } else {
            body.classList.remove('dark-mode');
            body.classList.add('light-mode');
        }
    });
});

document.querySelectorAll('.delete').forEach(button => {
    button.addEventListener('click', function(event) {
        event.preventDefault();
        const deleteLink = this.querySelector('a.delete-link');
        let originalHref = deleteLink.href;
        originalHref = originalHref.replaceAll("%255C", "/");
        let filename = originalHref.split('/').pop();
        filename = filename.replaceAll("%2520", " ");

        if (confirm(`${filename} is going to be deleted`)) {
            deleteLink.href = originalHref;
            window.location.href = originalHref;
        } else {
            deleteLink.href = '#';
            setTimeout(() => {
                deleteLink.href = originalHref;
            }, 100);
        }
    });
});

function checkSessionCode() {
    let sessionCode = sessionStorage.getItem('session_code');
    let sessionCodeExpiry = sessionStorage.getItem('session_code_expiry');

    if (sessionCode && sessionCodeExpiry) {
        let currentTime = Date.now();
        if (currentTime > sessionCodeExpiry) {
            sessionStorage.removeItem('session_code');
            sessionStorage.removeItem('session_code_expiry');
            //alert('Session has expired. Please log in again.');
        }
    }
}