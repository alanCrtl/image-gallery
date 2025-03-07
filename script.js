document.addEventListener('DOMContentLoaded', function() {
    initializeColumns();
});

const columnWidth = 250;

let currentFiles = [];
let isReversed = false;
let currentIndex = 0;

function handleSortChange() {
    currentIndex = 0;
    sortAndDisplayImages(currentFiles);
}

function handleReverseSort() {
    isReversed = !isReversed;
    currentIndex = 0;
    sortAndDisplayImages(currentFiles);
}

function handleScroll() {
    const galleryContainer = document.getElementById('galleryContainer');
    if (galleryContainer.scrollTop + galleryContainer.clientHeight >= galleryContainer.scrollHeight - 10) {
        loadMoreImages(currentFiles);
    }
}

document.getElementById('folderInput').addEventListener('change', function(event) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ''; // Clear existing images
    
    // Update our global files array
    currentFiles = Array.from(event.target.files);
    currentIndex = 0;
    
    sortAndDisplayImages(currentFiles);
});

// Set up other event listeners once, outside the change event
document.getElementById('sortOptions').addEventListener('change', handleSortChange);
document.getElementById('reverseSortButton').addEventListener('click', handleReverseSort);
document.getElementById('galleryContainer').addEventListener('scroll', handleScroll);

function initializeColumns() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ''; // Clear existing columns
    const numColumns = Math.floor(gallery.clientWidth / columnWidth);
    for (let i = 0; i < numColumns; i++) {
        const column = document.createElement('div');
        column.classList.add('column');
        gallery.appendChild(column);
    }
}

function loadMoreImages(files) {
    const columns = document.querySelectorAll('.column');
    let columnIndex = 0;
    const batchSize = 20; // Number of images to load per batch
    for (let i = currentIndex; i < currentIndex + batchSize && i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.classList.add('tile-img');
            img.src = URL.createObjectURL(file);
            img.onload = function() {
                imageElements.push(img);
            };
            img.addEventListener('click', function() {
                displaySelectedImage(img.src);
            });
            columns[columnIndex].appendChild(img);
            columnIndex = (columnIndex + 1) % columns.length;
        }
    }
    currentIndex += batchSize;
}

function sortFiles(files, criteria) {
    return files.sort((a, b) => {
        if (criteria === 'name') {
            return a.name.localeCompare(b.name);
        } else if (criteria === 'date') {
            return b.lastModified - a.lastModified;
        }
    });
}

function sortAndDisplayImages(files) {
    gallery.innerHTML = ''; // Clear existing images
    initializeColumns();
    let sortedFiles = sortFiles(files, sortOptions.value);
    if (isReversed) {
        sortedFiles.reverse();
    }
    loadMoreImages(sortedFiles);
}

function setupExpandButton() {
    if (selectedImageContainer.style.width === '45%') {
        expandButton.textContent = 'Collapse';
    } else {
        expandButton.textContent = 'Expand';
    }
    document.getElementById('expandButton').addEventListener('click', function() {
        const selectedImageContainer = document.getElementById('selectedImageContainer');
        const galleryContainer = document.getElementById('galleryContainer');
        const expandButton = document.getElementById('expandButton');
    
        if (selectedImageContainer.style.width === '45%') {
            selectedImageContainer.style.width = '25%';
            galleryContainer.style.width = '75%';
            expandButton.textContent = 'Expand';
        } else {
            selectedImageContainer.style.width = '45%';
            galleryContainer.style.width = '55%';
            expandButton.textContent = 'Collapse';
        }
    });
}
setupExpandButton();

function displaySelectedImage(src) {
    const selectedImageContainer = document.getElementById('selectedImageContainer');
    selectedImageContainer.innerHTML = '<button id="expandButton">Expand</button>'; // Clear existing image but keep the expand button
    const img = document.createElement('img');
    img.src = src;
    img.draggable = false; // Disable default drag behavior
    selectedImageContainer.appendChild(img);

    let scale = 1;
    const minScale = 0.5;
    const maxScale = 3;
    let isDragging = false;
    let startX, startY, initialX, initialY;

    selectedImageContainer.addEventListener('wheel', function(event) {
        event.preventDefault();
        scale *= Math.exp(event.deltaY * -0.001); // Less sensitive zoom
        scale = Math.min(maxScale, Math.max(minScale, scale));
        img.style.transform = `scale(${scale})`;
    });

    img.addEventListener('mousedown', function(event) {
        isDragging = true;
        startX = event.clientX;
        startY = event.clientY;
        initialX = img.offsetLeft;
        initialY = img.offsetTop;
        img.style.cursor = 'grabbing';
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    function onMouseMove(event) {
        if (isDragging) {
            const dx = event.clientX - startX;
            const dy = event.clientY - startY;
            img.style.left = `${initialX + dx}px`;
            img.style.top = `${initialY + dy}px`;
        }
    }

    function onMouseUp() {
        isDragging = false;
        img.style.cursor = 'grab';
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
    }

    // Re-add the expand button functionality
    setupExpandButton()
}
