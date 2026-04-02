const cloudinary = require('cloudinary').v2;
require('dotenv').config({ path: '.env.local' });

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const fs = require('fs');
const path = require('path');

async function test() {
  const pdfContent = '%PDF-1.4\n1 0 obj <</Type/Catalog/Pages 2 0 R>> endobj\n2 0 obj <</Type/Pages/Count 1/Kids[3 0 R]>> endobj\n3 0 obj <</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<<>>/Contents 4 0 R>> endobj\n4 0 obj <</Length 21>> stream\nBT /F1 24 Tf 100 700 Td (Hello World) Tj ET\nendstream endobj\nxref\n0 5\n0000000000 65535 f\n0000000009 00000 n\n0000000058 00000 n\n0000000115 00000 n\n0000000213 00000 n\ntrailer <</Size 5/Root 1 0 R>>\nstartxref\n285\n%%EOF';
  const filePath = path.join(process.cwd(), 'temp_test.pdf');
  fs.writeFileSync(filePath, pdfContent);

  console.log('--- Test 1: Uploading as RAW ---');
  try {
    const resRaw = await cloudinary.uploader.upload(filePath, {
      resource_type: 'raw',
      folder: 'test_raw',
      public_id: 'test_pdf_raw_' + Date.now()
    });
    console.log('Raw URL:', resRaw.secure_url);
  } catch (err) {
    console.error('Raw Upload Error:', err.message);
  }

  console.log('\n--- Test 2: Uploading as IMAGE ---');
  try {
    const resImg = await cloudinary.uploader.upload(filePath, {
      resource_type: 'image',
      folder: 'test_image',
      public_id: 'test_pdf_img_' + Date.now(),
      format: 'pdf'
    });
    console.log('Image URL:', resImg.secure_url);
    console.log('Image Download URL:', resImg.secure_url.replace('/upload/', '/upload/fl_attachment/'));
  } catch (err) {
    console.error('Image Upload Error:', err.message);
  }

  fs.unlinkSync(filePath);
}

test();
