import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import firebaseConfig from './firebase-applet-config.json';
import { courseData } from './src/data';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const cleanDates = async () => {
  const docRef = doc(db, "fichas", "3387401");
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    const students = data.asistencias_aprendices;
    let newFechasPorInstructor: any = {};
    
    Object.keys(data.fechas_por_instructor || {}).forEach(instructorName => {
      const dates = data.fechas_por_instructor[instructorName];
      const validDates = dates.filter((date: string) => {
        // check if any student has a record for this date
        return students.some((s: any) => s.registros && s.registros[date]);
      });
      newFechasPorInstructor[instructorName] = validDates;
    });

    console.log("Original dates:", data.fechas_por_instructor["Jorge Alexander Sepúlveda Vélez"]);
    console.log("Clean dates:", newFechasPorInstructor["Jorge Alexander Sepúlveda Vélez"]);

    await updateDoc(docRef, { 
      fechas_por_instructor: newFechasPorInstructor 
    });
    
    console.log("Updated Firestore.");

    // Let's also patch src/data.ts
    courseData.fechas_por_instructor = newFechasPorInstructor;
    const newContent = `export const courseData = ${JSON.stringify(courseData, null, 2)};\n`;
    fs.writeFileSync('src/data.ts', newContent);
    console.log("Updated src/data.ts");
  }
  
  process.exit(0);
};

cleanDates();
