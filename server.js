const http = require('http');
const fs = require('fs');
const path = require('path');
const https = require('https');

const PORT = 8000;
const MIME_TYPES = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.glb': 'model/gltf-binary',
    '.gltf': 'model/gltf+json'
};

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN || '';

/**
 * Uploads a base64 encoded image to tmpfiles.org and returns the direct download URL.
 */
function uploadToTmpFiles(base64Data, filename = 'image.png') {
    return new Promise((resolve, reject) => {
        try {
            const base64Content = base64Data.split(';base64,').pop();
            const buffer = Buffer.from(base64Content, 'base64');
            
            const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2);
            
            const payloadHeader = 
                `--${boundary}\r\n` +
                `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n` +
                `Content-Type: image/png\r\n\r\n`;
            
            const payloadFooter = `\r\n--${boundary}--\r\n`;
            
            const options = {
                hostname: 'tmpfiles.org',
                port: 443,
                path: '/api/v1/upload',
                method: 'POST',
                headers: {
                    'Content-Type': 'multipart/form-data; boundary=' + boundary,
                    'Content-Length': Buffer.byteLength(payloadHeader) + buffer.length + Buffer.byteLength(payloadFooter)
                }
            };
            
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(body);
                        if (parsed.status === 'success' && parsed.data && parsed.data.url) {
                            const directUrl = parsed.data.url.replace('https://tmpfiles.org/', 'https://tmpfiles.org/dl/');
                            resolve(directUrl);
                        } else {
                            reject(new Error('Failed upload response: ' + body));
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            
            req.on('error', reject);
            req.write(payloadHeader);
            req.write(buffer);
            req.write(payloadFooter);
            req.end();
        } catch (e) {
            reject(e);
        }
    });
}

/**
 * Creates a virtual try-on prediction on Replicate via their API.
 */
function createReplicatePrediction(humanUrl, garmentUrl) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            version: "c87181460ee7ccecd86abab2ec0fc4c7e14cbda1d6771efea504c75de5ff7b30",
            input: {
                crop: true,
                seed: 42,
                steps: 30,
                category: "dresses",
                force_dc: false,
                human_img: humanUrl,
                garm_img: garmentUrl,
                garment_des: "boutique dress"
            }
        });
        
        const options = {
            hostname: 'api.replicate.com',
            port: 443,
            path: '/v1/predictions',
            method: 'POST',
            headers: {
                'Authorization': `Token ${REPLICATE_API_TOKEN}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };
        
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    if (parsed.error || (res.statusCode !== 200 && res.statusCode !== 201)) {
                        reject(new Error(parsed.detail || parsed.error || `HTTP ${res.statusCode}`));
                    } else {
                        resolve(parsed);
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Polls the Replicate prediction API until the try-on result is ready.
 */
function pollReplicatePrediction(id) {
    return new Promise((resolve, reject) => {
        const interval = 2500;
        const maxAttempts = 30;
        let attempts = 0;
        
        const check = () => {
            attempts++;
            if (attempts > maxAttempts) {
                return reject(new Error('AI Virtual Try-On timed out.'));
            }
            
            const options = {
                hostname: 'api.replicate.com',
                port: 443,
                path: `/v1/predictions/${id}`,
                method: 'GET',
                headers: {
                    'Authorization': `Token ${REPLICATE_API_TOKEN}`
                }
            };
            
            const req = https.request(options, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    try {
                        const parsed = JSON.parse(body);
                        if (parsed.status === 'succeeded') {
                            const output = parsed.output;
                            if (Array.isArray(output) && output.length > 0) {
                                resolve(output[0]);
                            } else if (typeof output === 'string') {
                                resolve(output);
                            } else {
                                reject(new Error('No output image from AI model.'));
                            }
                        } else if (parsed.status === 'failed' || parsed.status === 'canceled') {
                            reject(new Error(`AI model prediction finished with status: ${parsed.status}`));
                        } else {
                            setTimeout(check, interval);
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });
            
            req.on('error', reject);
            req.end();
        };
        
        setTimeout(check, interval);
    });
}

const server = http.createServer((req, res) => {
    // Intercept AI Virtual Try-On API requests
    if (req.url === '/api/tryon' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            try {
                const data = JSON.parse(body);
                const { humanImage, garmentImage } = data;
                
                if (!REPLICATE_API_TOKEN) {
                    console.log("⚠️ No REPLICATE_API_TOKEN configured. Returning mock/simulated AI try-on.");
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ 
                        status: 'mocked', 
                        resultUrl: garmentImage 
                    }));
                    return;
                }
                
                const humanUrl = await uploadToTmpFiles(humanImage, 'human.png');
                const garmentUrl = await uploadToTmpFiles(garmentImage, 'garment.png');
                
                const prediction = await createReplicatePrediction(humanUrl, garmentUrl);
                const resultUrl = await pollReplicatePrediction(prediction.id);
                
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'success', resultUrl }));
            } catch (err) {
                console.error("❌ Error in tryon API:", err);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: err.message }));
            }
        });
        return;
    }
    
    let filePath = '.' + req.url;
    if (filePath === './' || filePath.split('?')[0] === './index.html') {
        filePath = './index.html';
    } else {
        // Strip out query params for local file reading
        filePath = filePath.split('?')[0];
    }
    
    const extname = String(path.extname(filePath)).toLowerCase();
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';
    
    fs.readFile(filePath, (error, content) => {
        if (error) {
            if (error.code === 'ENOENT') {
                res.writeHead(404);
                res.end('File not found');
            } else {
                res.writeHead(500);
                res.end('Server error: ' + error.code);
            }
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
});

server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
