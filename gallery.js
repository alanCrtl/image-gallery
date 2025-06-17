document.addEventListener('DOMContentLoaded', function() {
    initializeColumns();
});

const numColumns = 4; //hardcoded default number of columns at start
columnWidth = Math.floor(gallery.clientWidth / numColumns);
const useSmallestColumnFilling = true;

let currentFiles = [];
let isReversed = false;
let currentIndex = 0;
let offsetForScrollUpdate = 710;
let isLoading = false;
const imageColorData = new Map();

// --- Page Events Setup

function handleSortChange() {
    currentIndex = 0;
    sortAndDisplayImages(currentFiles);
}

function handleReverseSort() {
    isReversed = !isReversed;
    const sortOption = document.getElementById('sortOptions').value;
    if (sortOption == "random") {
        currentFiles = sortFiles(currentFiles, sortOption)
    }
    refreshImages()
}

function handleScroll() {
    const galleryContainer = document.getElementById('galleryContainer');
    if (galleryContainer.scrollTop + galleryContainer.clientHeight >= galleryContainer.scrollHeight - offsetForScrollUpdate && !isLoading) {
        isLoading = true;
        loadMoreImages(currentFiles);
    }
}

function handleColumnButtonClick(event) {
    document.querySelectorAll('.column-button').forEach(btn => btn.classList.remove('selected'));
    event.target.classList.add('selected');
    const numColumns = event.target.getAttribute('data-columns');
    const gallery = document.getElementById('gallery');
    columnWidth = Math.floor(gallery.clientWidth / numColumns);
    refreshImages();
}

document.getElementById('sortOptions').addEventListener('change', handleSortChange);
document.getElementById('reverseSortButton').addEventListener('click', handleReverseSort);
document.getElementById('galleryContainer').addEventListener('scroll', handleScroll);
document.querySelectorAll('.column-button').forEach(button => {
    button.addEventListener('click', handleColumnButtonClick);
});

// --- Sorting and Display Logic

// Prepares empty column structure
//  in which the images will be dropped
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

// Displays on load
document.getElementById('folderInput').addEventListener('change', function(event) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ''; // Clear existing images
    
    currentFiles = Array.from(event.target.files).filter(file => 
        /\.(jfif|jpg|jpeg|gif|png|bmp|webp|svg|tiff)$/i.test(file.name)
    );
    currentIndex = 0;
    
    sortAndDisplayImages(currentFiles);
});

/**
 * Loads more images into the gallery in batches,
 * distributing them across columns.
 */
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

// Refresh image display.
function refreshImages() {
    gallery.innerHTML = '';
    initializeColumns();
    currentIndex = 0;
    loadMoreImages(currentFiles);
}

// Sorts image file list based on criteria
async function sortFiles(files, criteria) {
    if (criteria === 'random') {
        for (let i = files.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [files[i], files[j]] = [files[j], files[i]];
        }
        return files;
    }
    if (criteria === 'color') {
        await analyzeImagesForColor(files);
        files.sort((a, b) => {
            const colorA = imageColorData.get(a.name);
            const colorB = imageColorData.get(b.name);
            
            if (!colorA || !colorB) return 0;
            
            // Sort by primary hue first, then by secondary hue
            const hueDiff = colorA.primaryHsv[0] - colorB.primaryHsv[0];
            if (Math.abs(hueDiff) > 5) return hueDiff;
            
            // If primary hues are similar, sort by secondary hue
            return colorA.secondaryHsv[0] - colorB.secondaryHsv[0];
        });
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

// Implements Sorting and Display of images in the gallery
async function sortAndDisplayImages(files) {
    const gallery = document.getElementById('gallery');
    const sortOption = document.getElementById('sortOptions').value;
    
    let sortedFiles = [...files];
    sortedFiles = await sortFiles(files, sortOption)
    if (isReversed) {
        sortedFiles.reverse();
    }

    // Clear gallery and reload with sorted images
    gallery.innerHTML = '';
    initializeColumns();
    currentIndex = 0;
    currentFiles = sortedFiles
    loadMoreImages(currentFiles);
}

// --- Sort Helper

// Analyze images for color data
async function analyzeImagesForColor(files) {
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.textContent = 'Analyzing colors...';
        loadingIndicator.style.display = 'block';
    }
    
    const batchSize = 5; // Process images in batches to avoid blocking UI
    
    for (let i = 0; i < files.length; i += batchSize) {
        const batch = files.slice(i, i + batchSize);
        const promises = batch.map(async (file) => {
            if (!imageColorData.has(file.name)) {
                const img = new Image();
                img.src = URL.createObjectURL(file);
                const colorData = await colorAnalyzer.analyzeImage(img);
                imageColorData.set(file.name, colorData);
                URL.revokeObjectURL(img.src);
            }
        });
        
        await Promise.all(promises);
        
        // Update progress
        if (loadingIndicator) {
            const progress = Math.round(((i + batchSize) / files.length) * 100);
            loadingIndicator.textContent = `Analyzing colors... (${Math.min(progress, 100)}%)`;
        }
        
        // Small delay to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
}

