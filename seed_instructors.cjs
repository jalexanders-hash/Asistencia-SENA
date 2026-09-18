const fs = require('fs');

async function run() {
  const config = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));
  const apiKey = config.apiKey;

  const instructors = [
    { nombre: "Xalima De Jesús Ruiz Doria", correo: "xaruiz@sena.edu.co" },
    { nombre: "Alfredo De Jesús Pérez Mendez", correo: "aperezm@sena.edu.co" },
    { nombre: "Leidy Carolina Cano Muñoz", correo: "lccano@sena.edu.co" },
    { nombre: "Jorge Alexander Sepúlveda Vélez", correo: "jasepulveda@sena.edu.co" },
    { nombre: "Dayana Marcela Diaz Dager", correo: "dayanadiaz@sena.edu.co" }
  ];

  for (const inst of instructors) {
    const firstName = inst.nombre.split(' ')[0];
    const password = `${firstName}2024*`;
    
    console.log(`Creating user: ${inst.correo} / ${password}`);

    const res = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inst.correo,
        password: password,
        returnSecureToken: false
      })
    });
    
    const data = await res.json();
    if (data.error) {
      if (data.error.message === 'EMAIL_EXISTS') {
        console.log(`User already exists: ${inst.correo}`);
      } else {
        console.log(`Failed to create ${inst.correo}: ${data.error.message}`);
      }
    } else {
      console.log(`Successfully created ${inst.correo}`);
    }
  }
}

run();
