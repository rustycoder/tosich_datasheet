import ExcelJS from 'exceljs';
import zlib from 'zlib';
import fs from 'fs';

// Helper to create simple PNG buffers in memory
function compressAndBuildPng(width, height, imgData) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeInt32BE(width, 0);
  ihdrData.writeInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth
  ihdrData.writeUInt8(2, 9); // color type (RGB)
  ihdrData.writeUInt8(0, 10); // compression
  ihdrData.writeUInt8(0, 11); // filter
  ihdrData.writeUInt8(0, 12); // interlace

  const ihdr = createChunk('IHDR', ihdrData);

  // Compress raw pixel data
  const compressed = zlib.deflateSync(imgData);
  const idat = createChunk('IDAT', compressed);

  // IEND chunk
  const iend = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function createChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeInt32BE(crc32(crcInput), 0);

  return Buffer.concat([len, typeBuf, data, crc]);
}

// Simple CRC32 implementation
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

function drawProductImage(width, height) {
  const rowSize = width * 3 + 1;
  const imgData = Buffer.alloc(rowSize * height);
  
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = width * 0.3;

  for (let y = 0; y < height; y++) {
    imgData.writeUInt8(0, y * rowSize); // Filter 0
    for (let x = 0; x < width; x++) {
      const idx = y * rowSize + 1 + x * 3;
      
      const dx = x - centerX;
      const dy = y - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      
      if (dist < radius) {
        // LED Bulb yellow-white emissive center
        imgData.writeUInt8(253, idx);     // R
        imgData.writeUInt8(224, idx + 1); // G
        imgData.writeUInt8(71, idx + 2);  // B
      } else if (dist < radius + 15) {
        // Aluminum heat sink outer ring
        imgData.writeUInt8(100, idx);     // R
        imgData.writeUInt8(116, idx + 1); // G
        imgData.writeUInt8(139, idx + 2); // B
      } else {
        // Deep background
        imgData.writeUInt8(15, idx);      // R
        imgData.writeUInt8(23, idx + 1);  // G
        imgData.writeUInt8(42, idx + 2);  // B
      }
    }
  }

  return compressAndBuildPng(width, height, imgData);
}

function drawDimensionImage(width, height) {
  const rowSize = width * 3 + 1;
  const imgData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    imgData.writeUInt8(0, y * rowSize); // Filter 0
    for (let x = 0; x < width; x++) {
      const idx = y * rowSize + 1 + x * 3;
      
      // Default white background
      let r = 255, g = 255, b = 255;
      
      // Draw grid lines (light grey)
      if (x % 20 === 0 || y % 20 === 0) {
        r = 241; g = 245; b = 249;
      }
      
      // Draw dimension lines (slate blue)
      // Outline box representing cut-out
      if (((x === 50 || x === 150) && y >= 50 && y <= 130) ||
          ((y === 50 || y === 130) && x >= 50 && x <= 150)) {
        r = 71; g = 85; b = 105;
      }
      
      // Dimension extension lines
      if (((x === 50 || x === 150) && y >= 130 && y <= 165)) {
        r = 148; g = 163; b = 184;
      }
      
      // Dimension line with arrow heads at ends
      if (y === 155 && x >= 50 && x <= 150) {
        r = 37; g = 99; b = 235; // Blue
      }
      
      // Ticks/Arrows
      if (y === 155 && (x === 52 || x === 53 || x === 147 || x === 148)) {
        r = 37; g = 99; b = 235;
      }
      if ((x === 50 || x === 150) && y >= 152 && y <= 158) {
        r = 37; g = 99; b = 235;
      }

      imgData.writeUInt8(r, idx);
      imgData.writeUInt8(g, idx + 1);
      imgData.writeUInt8(b, idx + 2);
    }
  }

  return compressAndBuildPng(width, height, imgData);
}

const outputPath = './sample-datasheet.xlsx';

async function generate() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Azoogi Products');

  // Setup columns
  worksheet.columns = [
    { header: 'NAME', key: 'NAME', width: 30 },
    { header: 'IMAGE', key: 'IMAGE', width: 25 },
    { header: 'DESCRIPTION', key: 'DESCRIPTION', width: 50 },
    { header: 'DIAGRAM', key: 'DIAGRAM', width: 25 },
    { header: 'SPECS', key: 'SPECS', width: 40 }
  ];

  // Set header styling
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).height = 25;

  const dummyData = [
    {
      NAME: 'Azoogi LED Downlight 10W',
      DESCRIPTION: 'High efficiency 10W LED recessed ceiling downlight with die-cast aluminum heat sink. Features premium Philips LEDs and clean white finish.',
      SPECS: 'Power: 10W\nLumen: 900lm\nCCT: 4000K\nCRI: >80\nBeam Angle: 60°\nCutout: 95mm\nIP Rating: IP44\nWarranty: 3 Years'
    },
    {
      NAME: 'Azoogi LED Downlight 12W',
      DESCRIPTION: 'Architectural grade 12W recessed spotlight featuring high color rendering index and deep dimming functionality. Ideal for residential and commercial lighting.',
      SPECS: 'Power: 12W\nLumen: 1100lm\nCCT: 3000K\nCRI: >90\nBeam Angle: 45°\nCutout: 95mm\nIP Rating: IP44\nWarranty: 3 Years'
    },
    {
      NAME: 'Azoogi LED Downlight 15W',
      DESCRIPTION: 'Super bright 15W LED downlight designed for high ceiling applications and task lighting. Commercial grade driver included.',
      SPECS: 'Power: 15W\nLumen: 1450lm\nCCT: 5000K\nCRI: >80\nBeam Angle: 90°\nCutout: 125mm\nIP Rating: IP20\nWarranty: 5 Years'
    },
    {
      NAME: 'Azoogi LED Downlight 8W Slim',
      DESCRIPTION: 'Ultra-thin 8W profile LED downlight perfect for shallow ceiling voids. Comes with integrated driver and quick connector.',
      SPECS: 'Power: 8W\nLumen: 720lm\nCCT: 4000K\nCRI: >80\nBeam Angle: 120°\nCutout: 90mm\nIP Rating: IP44\nWarranty: 2 Years'
    },
    {
      NAME: 'Azoogi LED Downlight 18W High Output',
      DESCRIPTION: 'High lumen output 18W downlight for retail and display spaces. Adjustable tilt mechanism for wall washing and focal illumination.',
      SPECS: 'Power: 18W\nLumen: 1800lm\nCCT: 4000K\nCRI: >85\nBeam Angle: 36°\nCutout: 125mm\nIP Rating: IP20\nWarranty: 5 Years'
    }
  ];

  // Add rows & set cell styles
  dummyData.forEach((data, index) => {
    const row = worksheet.addRow({
      NAME: data.NAME,
      IMAGE: '', // placeholder for floating image
      DESCRIPTION: data.DESCRIPTION,
      DIAGRAM: '', // placeholder for floating image
      SPECS: data.SPECS
    });

    row.height = 100;
    row.getCell('DESCRIPTION').alignment = { wrapText: true, vertical: 'middle' };
    row.getCell('SPECS').alignment = { wrapText: true, vertical: 'middle' };
    row.getCell('NAME').alignment = { vertical: 'middle' };
  });

  // Generate image buffers dynamically in memory
  const productBuf = drawProductImage(200, 200);
  const dimensionBuf = drawDimensionImage(200, 200);

  // Add images to workbook
  const productImgId = workbook.addImage({
    buffer: productBuf,
    extension: 'png'
  });

  const dimensionImgId = workbook.addImage({
    buffer: dimensionBuf,
    extension: 'png'
  });

  // Embed images in worksheet rows (Col B = Picture, Col D = Dimension)
  for (let i = 0; i < dummyData.length; i++) {
    const rowIdx = i + 1; // Native row 1 = excel row 2

    // Product Picture (Col B = nativeCol 1)
    worksheet.addImage(productImgId, {
      tl: { col: 1, row: rowIdx },
      br: { col: 2, row: rowIdx + 1 },
      editAs: 'oneCell'
    });

    // Dimension Picture (Col D = nativeCol 3)
    worksheet.addImage(dimensionImgId, {
      tl: { col: 3, row: rowIdx },
      br: { col: 4, row: rowIdx + 1 },
      editAs: 'oneCell'
    });
  }

  // Save workbook using in-memory writeBuffer to bypass EPERM issues on /tmp
  const buffer = await workbook.xlsx.writeBuffer();
  fs.writeFileSync(outputPath, buffer);
  console.log('Successfully created sample Excel file at:', outputPath);
}

generate().catch(console.error);
