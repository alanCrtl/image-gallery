document.addEventListener('DOMContentLoaded', function() {
    initializeColumns();
});

let columnWidth = 275; // Default column width
const useSmallestColumnFilling = true;

let currentFiles = [];
let isReversed = false;
let currentIndex = 0;
let offsetForScrollUpdate = 710;
let isLoading = false;

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
    if (galleryContainer.scrollTop + galleryContainer.clientHeight >= galleryContainer.scrollHeight - offsetForScrollUpdate && !isLoading) {
        isLoading = true;
        loadMoreImages(currentFiles);
    }
}

document.getElementById('folderInput').addEventListener('change', function(event) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ''; // Clear existing images
    
    // Update our global files array
    currentFiles = Array.from(event.target.files).filter(file => 
        /\.(jfif|jpg|jpeg|gif|png|bmp|webp|svg|tiff)$/i.test(file.name)
    );
    currentIndex = 0;
    
    sortAndDisplayImages(currentFiles);
});

// Set up other event listeners once, outside the change event
document.getElementById('sortOptions').addEventListener('change', handleSortChange);
document.getElementById('reverseSortButton').addEventListener('click', handleReverseSort);
document.getElementById('galleryContainer').addEventListener('scroll', handleScroll);
document.querySelectorAll('.column-button').forEach(button => {
    button.addEventListener('click', function(event) {
        document.querySelectorAll('.column-button').forEach(btn => btn.classList.remove('selected'));
        event.target.classList.add('selected');
        const numColumns = event.target.getAttribute('data-columns');
        const gallery = document.getElementById('gallery');
        columnWidth = Math.floor(gallery.clientWidth / numColumns);
        refreshImages();
    });
});

function initializeColumns() {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ''; // Clear existing columns
    const numColumns = Math.floor(gallery.clientWidth / columnWidth);
    for (let i = 0; i < numColumns; i++) {
        const column = document.createElement('div');
        column.classList.add('column');
        column.dataset.height = 0;
        column.style.width = columnWidth + 'px';
        gallery.appendChild(column);
    }
}

function loadMoreImages(files) {
    const columns = document.querySelectorAll('.column');
    let columnIndex = 0;
    const batchSize = 50;

    // Check if there are more images to load
    if (currentIndex >= files.length) {
        isLoading = false;
        return;
    }

    // Preload all images in the batch
    const imagePromises = [];
    for (let i = currentIndex; i < currentIndex + batchSize && i < files.length; i++) {
        const file = files[i];
        if (file.type.startsWith('image/')) {
            const img = new Image();
            img.src = URL.createObjectURL(file);
            imagePromises.push(new Promise((resolve) => {
                img.onload = () => resolve({ img, file });
            }));
        }
    }

    Promise.all(imagePromises).then((loadedImages) => {
        loadedImages.forEach(({ img, file }) => {
            img.classList.add('tile-img');
            // Calculate image height based on column width
            const imgHeight = img.naturalHeight * (columnWidth / img.naturalWidth);
            if (useSmallestColumnFilling) {
                // Find the column with the smallest height
                let minHeight = Infinity;
                let minColumn = null;
                columns.forEach(column => {
                    const columnHeight = parseFloat(column.dataset.height);
                    if (columnHeight < minHeight) {
                        minHeight = columnHeight;
                        minColumn = column;
                    }
                });
                minColumn.appendChild(img);
                minColumn.dataset.height = parseFloat(minColumn.dataset.height) + imgHeight;
            } else {
                columns[columnIndex].appendChild(img);
                columnIndex = (columnIndex + 1) % columns.length;
            }
            img.addEventListener('click', function() {
                displaySelectedImage(img.src, file.name);
            });
        });
        currentIndex += batchSize; // Update currentIndex after loading the batch
        isLoading = false; // Reset the loading flag
    });
}

function sortFiles(files, criteria) {
    if (criteria === 'random') {
        for (let i = files.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [files[i], files[j]] = [files[j], files[i]];
        }
        return files;
    }
    return files.sort((a, b) => {
        if (criteria === 'name') {
            return a.name.localeCompare(b.name);
        } else if (criteria === 'date') {
            return b.lastModified - a.lastModified;
        } else if (criteria === 'filesize') {
            return a.size - b.size;
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

function refreshImages() {
    gallery.innerHTML = '';
    initializeColumns();
    currentIndex = 0;
    loadMoreImages(currentFiles);
}
