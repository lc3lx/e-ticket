// import sharp from 'sharp';
// import path from 'path';
// import fs from 'fs';

// const sharpPhoto = async (bufferPhoto: Buffer, fileName: string, fieldName: string): Promise<void> => {
//   let outputPath = '';
//   if (fieldName === 'profilePicture') outputPath = path.join(__dirname, '..', 'uploads', 'profile_pics', fileName);
//   if (fieldName === 'mainPhoto') outputPath = path.join(__dirname, '..', 'uploads', 'events', 'main', fileName);
//   if (fieldName === 'miniPoster') outputPath = path.join(__dirname, '..', 'uploads', 'events', 'miniPoster', fileName);
//   if (fieldName === 'eventPhotos') outputPath = path.join(__dirname, '..', 'uploads', 'events', 'others', fileName);

//   if (!fs.existsSync(path.dirname(outputPath))) {
//     fs.mkdirSync(path.dirname(outputPath), { recursive: true });
//   }

//   try {
//     await sharp(bufferPhoto)
//       // .resize(500, 500, { fit: 'contain' })
//       .toFormat('jpeg')
//       .jpeg({ quality: 90 })
//       .toFile(outputPath);
//   } catch (err) {
//     throw new Error(`Error processing image: ${(err as Error).message}`);
//   }
// };

// export default sharpPhoto;
