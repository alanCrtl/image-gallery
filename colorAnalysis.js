// K-means clustering for color analysis
class ColorAnalyzer {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    // Extract pixel data from image
    getImageData(img, maxSize = 100) {
        // Resize for performance
        const scale = Math.min(maxSize / img.width, maxSize / img.height);
        this.canvas.width = img.width * scale;
        this.canvas.height = img.height * scale;
        
        this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Convert to RGB array, skip transparent pixels
        const pixels = [];
        for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            
            if (a > 128) { // Skip mostly transparent pixels
                pixels.push([r, g, b]);
            }
        }
        return pixels;
    }

    // K-means clustering implementation
    kMeansColors(pixels, k = 2, maxIterations = 20) {
        if (pixels.length === 0) return [];
        
        // Initialize centroids randomly
        let centroids = [];
        for (let i = 0; i < k; i++) {
            const randomPixel = pixels[Math.floor(Math.random() * pixels.length)];
            centroids.push([...randomPixel]);
        }

        for (let iter = 0; iter < maxIterations; iter++) {
            // Assign pixels to closest centroid
            const clusters = Array(k).fill().map(() => []);
            
            for (const pixel of pixels) {
                let minDistance = Infinity;
                let closestCentroid = 0;
                
                for (let i = 0; i < centroids.length; i++) {
                    const distance = this.colorDistance(pixel, centroids[i]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCentroid = i;
                    }
                }
                clusters[closestCentroid].push(pixel);
            }

            // Update centroids
            const newCentroids = [];
            for (let i = 0; i < k; i++) {
                if (clusters[i].length === 0) {
                    newCentroids.push([...centroids[i]]);
                } else {
                    const avgR = clusters[i].reduce((sum, p) => sum + p[0], 0) / clusters[i].length;
                    const avgG = clusters[i].reduce((sum, p) => sum + p[1], 0) / clusters[i].length;
                    const avgB = clusters[i].reduce((sum, p) => sum + p[2], 0) / clusters[i].length;
                    newCentroids.push([Math.round(avgR), Math.round(avgG), Math.round(avgB)]);
                }
            }

            // Check for convergence
            let converged = true;
            for (let i = 0; i < k; i++) {
                if (this.colorDistance(centroids[i], newCentroids[i]) > 1) {
                    converged = false;
                    break;
                }
            }

            centroids = newCentroids;
            if (converged) break;
        }

        // Sort clusters by size (most dominant first)
        const clustersWithSizes = centroids.map((centroid, i) => ({
            color: centroid,
            size: pixels.filter(pixel => {
                let minDistance = Infinity;
                let closestCentroid = 0;
                for (let j = 0; j < centroids.length; j++) {
                    const distance = this.colorDistance(pixel, centroids[j]);
                    if (distance < minDistance) {
                        minDistance = distance;
                        closestCentroid = j;
                    }
                }
                return closestCentroid === i;
            }).length
        }));

        return clustersWithSizes
            .sort((a, b) => b.size - a.size)
            .map(cluster => cluster.color);
    }

    // Euclidean distance in RGB space
    colorDistance(color1, color2) {
        const dr = color1[0] - color2[0];
        const dg = color1[1] - color2[1];
        const db = color1[2] - color2[2];
        return Math.sqrt(dr * dr + dg * dg + db * db);
    }

    // Convert RGB to HSV for better color sorting
    rgbToHsv(r, g, b) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const diff = max - min;

        let h = 0;
        if (diff !== 0) {
            if (max === r) h = ((g - b) / diff) % 6;
            else if (max === g) h = (b - r) / diff + 2;
            else h = (r - g) / diff + 4;
        }
        h = Math.round(h * 60);
        if (h < 0) h += 360;

        const s = max === 0 ? 0 : diff / max;
        const v = max;

        return [h, s * 100, v * 100];
    }

    // Analyze image and return dominant colors
    async analyzeImage(imgElement) {
        return new Promise((resolve) => {
            if (imgElement.complete) {
                this.processImage(imgElement, resolve);
            } else {
                imgElement.onload = () => this.processImage(imgElement, resolve);
            }
        });
    }

    processImage(imgElement, resolve) {
        try {
            const pixels = this.getImageData(imgElement);
            const dominantColors = this.kMeansColors(pixels, 2);
            
            const result = {
                primary: dominantColors[0] || [128, 128, 128],
                secondary: dominantColors[1] || dominantColors[0] || [128, 128, 128]
            };

            // Convert to HSV for sorting
            result.primaryHsv = this.rgbToHsv(...result.primary);
            result.secondaryHsv = this.rgbToHsv(...result.secondary);

            resolve(result);
        } catch (error) {
            console.error('Error analyzing image:', error);
            resolve({
                primary: [128, 128, 128],
                secondary: [128, 128, 128],
                primaryHsv: [0, 0, 50],
                secondaryHsv: [0, 0, 50]
            });
        }
    }
}

// Global color analyzer instance
const colorAnalyzer = new ColorAnalyzer();
