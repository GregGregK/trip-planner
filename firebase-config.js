// firebase-config.js - Configuração e inicialização do Firebase

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAZDWWgwBa3SxRKwpgE5wngvfqNwd2zn_0",
  authDomain: "trip-planner-bc3f9.firebaseapp.com",
  projectId: "trip-planner-bc3f9",
  storageBucket: "trip-planner-bc3f9.firebasestorage.app",
  messagingSenderId: "773438000028",
  appId: "1:773438000028:web:cb68ee7f07078740731659"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);

// Referências globais
const db = firebase.firestore();
const auth = firebase.auth();

// Habilitar persistência offline (opcional mas recomendado)
db.enablePersistence()
  .then(() => {
    console.log('✓ Persistência offline habilitada');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Persistência offline indisponível (múltiplas abas abertas)');
    } else if (err.code === 'unimplemented') {
      console.warn('Navegador não suporta persistência offline');
    }
  });

// Variáveis de estado da sessão
let currentUser = null;
let currentTripId = null;