import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { db, storage } from './firebase';

// Collection name for memes
const MEMES_COLLECTION = 'memes';

// Upload image to Firebase Storage
export const uploadImageToFirebase = async (imageFile, memeId) => {
  try {
    // Create a reference to the file location
    const imageRef = ref(storage, `memes/${memeId}_${imageFile.name}`);
    
    // Upload the file
    const snapshot = await uploadBytes(imageRef, imageFile);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
};

// Add a new meme to Firestore
export const addMemeToFirebase = async (meme) => {
  try {
    const docRef = await addDoc(collection(db, MEMES_COLLECTION), {
      ...meme,
      createdAt: new Date().toISOString()
    });
    
    return { id: docRef.id, ...meme };
  } catch (error) {
    console.error('Error adding meme:', error);
    throw error;
  }
};

// Get all memes from Firestore
export const getMemesFromFirebase = async () => {
  try {
    const q = query(
      collection(db, MEMES_COLLECTION), 
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const memes = [];
    
    querySnapshot.forEach((doc) => {
      memes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return memes;
  } catch (error) {
    console.error('Error fetching memes:', error);
    throw error;
  }
};

// Delete a meme from Firestore and Storage
export const deleteMemeFromFirebase = async (memeId, imageUrl) => {
  try {
    // Delete from Firestore
    await deleteDoc(doc(db, MEMES_COLLECTION, memeId));
    
    // Delete image from Storage if it exists
    if (imageUrl && imageUrl.includes('firebase')) {
      const imageRef = ref(storage, imageUrl);
      await deleteObject(imageRef);
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting meme:', error);
    throw error;
  }
};

// Helper function to extract file extension
export const getFileExtension = (fileName) => {
  return fileName.split('.').pop();
}; 