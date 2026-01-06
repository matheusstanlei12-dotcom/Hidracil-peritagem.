
const fs = require('fs');
const path = require('path');

// Using absolute path from metadata
const imgPath = "C:/Users/User/.gemini/antigravity/brain/889eca64-a109-409b-9980-b3ec5143955b/uploaded_image_0_1767018265499.jpg";

try {
    const bitmap = fs.readFileSync(imgPath);
    const base64 = Buffer.from(bitmap).toString('base64');
    const finalStr = `data:image/jpeg;base64,${base64}`;
    fs.writeFileSync('logo-base64.txt', finalStr);
    console.log("Success");
} catch (e) {
    console.error(e);
}
